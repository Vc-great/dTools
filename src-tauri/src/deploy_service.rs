use anyhow::{Context, Result};
use chrono::Utc;
use git2::{Repository, Cred, RemoteCallbacks, FetchOptions};
use serde::{Deserialize, Serialize};
use ssh2::Session;
use std::env;
use std::fs;
use std::io::prelude::*;
use std::net::TcpStream;
use std::path::Path;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DeployConfig {
    pub git: GitConfig,
    pub vm: VmConfig,
    pub docker: DockerConfig,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GitConfig {
    pub repo_url: String,
    pub branch: String,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct VmConfig {
    pub host: String,
    pub user: String,
    pub password: String,
    pub deploy_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct DockerConfig {
    pub image: String,
    pub container: String,
    pub port_mapping: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct DeployLogMessage {
    pub id: String,
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub step: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DeployProgress {
    pub id: String,
    pub current_step: String,
    pub progress: f32,
    pub status: String, // "running", "success", "error"
    pub error: Option<String>,
}

// Git信息结构体 - 移动到模块级别
#[derive(Debug, Clone)]
struct GitInfo {
    branch: String,
    commit_hash: String,
    commit_message: String,
}

pub struct DeployService {
    app_handle: AppHandle,
    pub deploy_id: String,
    config: DeployConfig,
    pub current_step: Arc<Mutex<String>>,
    pub progress: Arc<Mutex<f32>>,
}

impl DeployService {
    pub fn new(app_handle: AppHandle, config: DeployConfig) -> Self {
        let deploy_id = Uuid::new_v4().to_string();
        Self {
            app_handle,
            deploy_id,
            config,
            current_step: Arc::new(Mutex::new("准备开始".to_string())),
            progress: Arc::new(Mutex::new(0.0)),
        }
    }

    // 获取跨平台的临时目录路径
    fn get_temp_dir() -> Result<String> {
        let temp_base = if cfg!(target_os = "windows") {
            // Windows: 使用 TEMP 环境变量
            env::var("TEMP").unwrap_or_else(|_| "C:\\Windows\\Temp".to_string())
        } else {
            // Unix-like systems (macOS, Linux): 使用 /tmp
            "/tmp".to_string()
        };

        // 创建唯一的临时目录名
        let timestamp = Utc::now().timestamp();
        let uuid_short = Uuid::new_v4().to_string()[..8].to_string();
        let temp_dir = format!("{}/temp_deploy_{}_{}", temp_base, timestamp, uuid_short);

        Ok(temp_dir)
    }

    pub fn get_deploy_id(&self) -> &str {
        &self.deploy_id
    }

    pub async fn get_current_step(&self) -> String {
        self.current_step.lock().await.clone()
    }

    // 保留该方法供将来使用，添加 allow 属性避免警告
    #[allow(dead_code)]
    pub async fn get_progress(&self) -> f32 {
        *self.progress.lock().await
    }

    pub async fn start_deployment(&self) -> Result<()> {
        self.emit_progress("开始部署", 0.0, "running").await;
        self.emit_log("info", "开始前端部署流程", Some("初始化")).await;

        let result = self.execute_deployment().await;

        match result {
            Ok(_) => {
                self.emit_progress("部署完成", 100.0, "success").await;
                self.emit_log("success", "部署成功完成", Some("完成")).await;
            }
            Err(ref e) => {
                self.emit_progress("部署失败", 0.0, "error").await;
                self.emit_log("error", &format!("部署失败: {}", e), Some("错误")).await;
            }
        }

        result
    }

    async fn execute_deployment(&self) -> Result<()> {
        // 步骤1: 清理远程部署目录 (5%)
        self.emit_progress("清理部署目录", 5.0, "running").await;
        let session = self.connect_to_vm().await?;
        self.cleanup_remote_deploy_path(&session).await?;

        // 步骤2: 克隆Git仓库 (20%)
        self.emit_progress("克隆代码", 20.0, "running").await;
        let local_path = Self::get_temp_dir()?;
        self.emit_log("info", &format!("使用临时目录: {}", local_path), Some("初始化")).await;

        let git_info = self.clone_repository(&local_path).await?;

        // 步骤3: 上传文件 (50%)
        self.emit_progress("上传文件", 50.0, "running").await;
        self.upload_files(&session, &local_path).await?;

        // 步骤4: 构建Docker镜像 (70%)
        self.emit_progress("构建镜像", 70.0, "running").await;
        self.build_docker_image(&session).await?;

        // 步骤5: 部署容器 (90%)
        self.emit_progress("部署容器", 90.0, "running").await;
        self.deploy_container(&session).await?;

        // 步骤6: 清理 (100%)
        self.emit_progress("清理临时文件", 100.0, "running").await;
        self.cleanup(&local_path).await?;

        // 输出最终的Git信息
        self.emit_log("success", &format!("部署完成 - 分支: {}, 提交: {} ({})", 
            git_info.branch, git_info.commit_hash, git_info.commit_message), Some("完成")).await;

        Ok(())
    }

    // 新增：清理远程部署目录的方法
    async fn cleanup_remote_deploy_path(&self, session: &Session) -> Result<()> {
        let remote_path = &self.config.vm.deploy_path;
        self.emit_log("info", &format!("检查并清理远程部署目录: {}", remote_path), Some("清理部署目录")).await;

        // 检查目录是否存在
        let check_cmd = format!("[ -d '{}' ] && echo 'exists' || echo 'not_exists'", remote_path);
        let check_result = self.execute_ssh_command(session, &check_cmd, "清理部署目录").await?;

        if check_result.trim() == "exists" {
            self.emit_log("info", &format!("发现同名目录，正在删除: {}", remote_path), Some("清理部署目录")).await;
            let remove_cmd = format!("rm -rf '{}'", remote_path);
            self.execute_ssh_command(session, &remove_cmd, "清理部署目录").await?;
            self.emit_log("success", "同名目录已删除", Some("清理部署目录")).await;
        } else {
            self.emit_log("info", "目标目录不存在，无需清理", Some("清理部署目录")).await;
        }

        Ok(())
    }


    async fn clone_repository(&self, local_path: &str) -> Result<GitInfo> {
        let config = &self.config.git;
        self.emit_log("info", &format!("正在克隆仓库: {} (分支: {})", config.repo_url, config.branch), Some("克隆代码")).await;

        // 使用tokio::task::spawn_blocking来处理同步的Git操作
        let repo_url = config.repo_url.clone();
        let branch = config.branch.clone();
        let username = config.username.clone();
        let password = config.password.clone();
        let local_path_owned = local_path.to_string();

        let result = tokio::task::spawn_blocking(move || {
            let repo = if username.is_some() && password.is_some() {
                let mut callbacks = RemoteCallbacks::new();
                let username = username.unwrap();
                let password = password.unwrap();

                callbacks.credentials(move |_url, username_from_url, _allowed_types| {
                    let user = username_from_url.unwrap_or(&username);
                    Cred::userpass_plaintext(user, &password)
                });

                let mut fetch_options = FetchOptions::new();
                fetch_options.remote_callbacks(callbacks);

                let mut builder = git2::build::RepoBuilder::new();
                builder.fetch_options(fetch_options);
                builder.clone(&repo_url, Path::new(&local_path_owned))?
            } else {
                Repository::clone(&repo_url, &local_path_owned)?
            };

            // 切换到指定分支
            Self::checkout_branch_sync(&repo, &branch)?;

            // 获取Git信息
            let head = repo.head()?;
            let commit = head.peel_to_commit()?;
            let commit_hash = commit.id().to_string();
            let short_hash = &commit_hash[..8]; // 获取短SHA
            let commit_message = commit.message().unwrap_or("").trim().to_string();
            
            // 获取当前分支名
            let current_branch = if head.is_branch() {
                head.shorthand().unwrap_or(&branch).to_string()
            } else {
                branch.clone()
            };

            let git_info = GitInfo {
                branch: current_branch,
                commit_hash: short_hash.to_string(),
                commit_message,
            };

            Ok::<GitInfo, anyhow::Error>(git_info)
        }).await?;

        let git_info = result?;
        
        self.emit_log("success", &format!("成功克隆到本地路径: {}", local_path), Some("克隆代码")).await;
        self.emit_log("info", &format!("分支: {}, 提交: {} - {}", 
            git_info.branch, git_info.commit_hash, git_info.commit_message), Some("克隆代码")).await;
        
        Ok(git_info)
    }

    fn checkout_branch_sync(repo: &Repository, branch: &str) -> Result<()> {
        let local_branch_ref = format!("refs/heads/{}", branch);
        let remote_branch_ref = format!("refs/remotes/origin/{}", branch);

        if repo.find_reference(&local_branch_ref).is_ok() {
            let (object, reference) = repo.revparse_ext(branch)?;
            repo.checkout_tree(&object, None)?;
            if let Some(gref) = reference {
                repo.set_head(gref.name().unwrap())?;
            } else {
                repo.set_head_detached(object.id())?;
            }
        } else if let Ok(remote_ref) = repo.find_reference(&remote_branch_ref) {
            let target = remote_ref.target().ok_or_else(|| anyhow::anyhow!("远端分支无目标对象"))?;
            repo.branch(branch, &repo.find_commit(target)?, true)?;
            let (object, reference) = repo.revparse_ext(branch)?;
            repo.checkout_tree(&object, None)?;
            if let Some(gref) = reference {
                repo.set_head(gref.name().unwrap())?;
            } else {
                repo.set_head_detached(object.id())?;
            }
        } else {
            return Err(anyhow::anyhow!(
                "分支 '{}' 不存在于本地或远端仓库，请检查分支名称是否正确",
                branch
            ));
        }
        Ok(())
    }

    async fn connect_to_vm(&self) -> Result<Session> {
        let config = &self.config.vm;
        self.emit_log("info", &format!("正在连接虚拟机: {}@{}", config.user, config.host), Some("连接虚拟机")).await;

        let tcp = TcpStream::connect(format!("{}:22", config.host))
            .context("无法连接到虚拟机")?;
        let mut sess = Session::new()?;
        sess.set_tcp_stream(tcp);
        sess.handshake()?;
        sess.userauth_password(&config.user, &config.password)
            .context("SSH认证失败")?;

        self.emit_log("success", "SSH连接成功", Some("连接虚拟机")).await;
        Ok(sess)
    }

    async fn upload_files(&self, session: &Session, local_path: &str) -> Result<()> {
        let remote_path = &self.config.vm.deploy_path;
        self.emit_log("info", &format!("开始上传文件到: {}", remote_path), Some("上传文件")).await;

        // 创建远程目录
        let create_dir_cmd = format!("mkdir -p {}", remote_path);
        self.execute_ssh_command(session, &create_dir_cmd, "上传文件").await?;

        // 使用tar方式上传
        self.upload_via_tar(session, local_path, remote_path).await?;
        self.emit_log("success", "文件上传完成", Some("上传文件")).await;
        Ok(())
    }

    async fn upload_via_tar(&self, session: &Session, local_path: &str, remote_path: &str) -> Result<()> {
        use std::process::Command;

        self.emit_log("info", "使用tar打包方式上传文件", Some("上传文件")).await;

        // 获取跨平台的临时tar包路径
        let temp_tar = if cfg!(target_os = "windows") {
            let temp_dir = env::var("TEMP").unwrap_or_else(|_| "C:\\Windows\\Temp".to_string());
            format!("{}\\deploy_temp.tar.gz", temp_dir)
        } else {
            "/tmp/deploy_temp.tar.gz".to_string()
        };

        let mut tar_args = vec![
            "-czf",
            &temp_tar,
            "--exclude",
            ".git",
            "--exclude",
            ".gitignore",
            "--exclude",
            ".DS_Store",
        ];

        if cfg!(target_os = "macos") {
            tar_args.push("--no-xattrs");
        }

        tar_args.extend_from_slice(&["-C", local_path, "."]);

        let output = Command::new("tar")
            .args(&tar_args)
            .output()
            .context("执行tar命令失败")?;

        if !output.status.success() {
            return Err(anyhow::anyhow!(
                "tar命令执行失败: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // 传输tar包
        let tar_data = std::fs::read(&temp_tar)?;
        let remote_tar = format!("{}/deploy_temp.tar.gz", remote_path);

        let mut remote_file = session.scp_send(Path::new(&remote_tar), 0o644, tar_data.len() as u64, None)?;
        remote_file.write_all(&tar_data)?;
        remote_file.send_eof()?;
        remote_file.wait_eof()?;
        remote_file.close()?;
        remote_file.wait_close()?;

        // 解压缩
        let extract_cmd = format!(
            "cd {} && tar -xzf deploy_temp.tar.gz 2>/dev/null || tar -xzf deploy_temp.tar.gz && rm -f deploy_temp.tar.gz",
            remote_path
        );
        self.execute_ssh_command(session, &extract_cmd, "上传文件").await?;

        // 清理本地临时文件
        std::fs::remove_file(&temp_tar)?;
        Ok(())
    }

    async fn build_docker_image(&self, session: &Session) -> Result<()> {
        let config = &self.config;
        self.emit_log("info", &format!("开始构建Docker镜像: {}", config.docker.image), Some("构建镜像")).await;

        let build_cmd = format!("cd {} && docker build -t {} .", config.vm.deploy_path, config.docker.image);
        self.execute_ssh_command(session, &build_cmd, "构建镜像").await?;

        self.emit_log("success", "Docker镜像构建完成", Some("构建镜像")).await;
        Ok(())
    }

    async fn deploy_container(&self, session: &Session) -> Result<()> {
        let config = &self.config.docker;
        self.emit_log("info", &format!("停止并删除旧容器: {}", config.container), Some("部署容器")).await;

        // 停止并删除旧容器
        let stop_cmd = format!("docker stop {} || true", config.container);
        let _ = self.execute_ssh_command(session, &stop_cmd, "部署容器").await;

        let remove_cmd = format!("docker rm {} || true", config.container);
        let _ = self.execute_ssh_command(session, &remove_cmd, "部署容器").await;

        // 启动新容器
        self.emit_log("info", &format!("启动Docker容器: {}", config.container), Some("部署容器")).await;
        let run_cmd = format!(
            "docker run -d --name {} -p {} {}",
            config.container, config.port_mapping, config.image
        );
        self.execute_ssh_command(session, &run_cmd, "部���容器").await?;

        // 检查容器状态
        let status_cmd = format!("docker ps --filter name={} --format '{{{{.Status}}}}'", config.container);
        let status_output = self.execute_ssh_command(session, &status_cmd, "部署容器").await?;

        if status_output.trim().is_empty() {
            return Err(anyhow::anyhow!("容器启动失败"));
        }

        self.emit_log("success", &format!("容器启动成功，状态: {}", status_output.trim()), Some("部署容器")).await;
        Ok(())
    }

    async fn cleanup(&self, local_path: &str) -> Result<()> {
        self.emit_log("info", &format!("清理本地临时文件: {}", local_path), Some("清理")).await;

        match fs::remove_dir_all(local_path) {
            Ok(_) => self.emit_log("success", "本地文件清理完成", Some("清理")).await,
            Err(e) => self.emit_log("warning", &format!("清理本地文件失败: {}", e), Some("清理")).await,
        }

        Ok(())
    }

    async fn execute_ssh_command(&self, session: &Session, command: &str, step: &str) -> Result<String> {
        self.emit_log("info", &format!("执行命令: {}", command), Some(step)).await;

        let mut channel = session.channel_session()?;
        channel.exec(command)?;

        let mut output = String::new();
        let mut stdout_buffer = [0; 4096]; // 增大缓冲区
        let mut stderr_buffer = [0; 4096];
        let mut line_buffer = String::new();
        let mut stderr_line_buffer = String::new();

        // 设置非阻塞模式以便同时读取stdout和stderr
        loop {
            let mut has_data = false;

            // 尝试读取标准输出
            match channel.read(&mut stdout_buffer) {
                Ok(0) => {
                    // stdout结束，但继续检查stderr
                }
                Ok(n) => {
                    has_data = true;
                    let chunk = String::from_utf8_lossy(&stdout_buffer[..n]);
                    output.push_str(&chunk);
                    line_buffer.push_str(&chunk);

                    // 处理完整的行
                    while let Some(newline_pos) = line_buffer.find('\n') {
                        let line = line_buffer[..newline_pos].trim();
                        if !line.is_empty() {
                            // 为Docker构建输出添加特殊处理
                            if command.contains("docker build") {
                                if line.starts_with("Step ") || line.starts_with("---> ") ||
                                   line.contains("Successfully built") || line.contains("Successfully tagged") ||
                                   line.contains("COPY") || line.contains("RUN") || line.contains("FROM") ||
                                   line.contains("WORKDIR") || line.contains("EXPOSE") || line.contains("CMD") {
                                    self.emit_log("info", &format!("🐳 {}", line), Some(step)).await;
                                } else {
                                    self.emit_log("info", &format!("   {}", line), Some(step)).await;
                                }
                            } else {
                                self.emit_log("info", &format!("📤 {}", line), Some(step)).await;
                            }
                        }
                        line_buffer = line_buffer[newline_pos + 1..].to_string();
                    }
                }
                Err(_) => {
                    // 如果是EAGAIN（会阻塞），继续尝试stderr
                }
            }

            // 尝试读取标准错误输出
            match channel.stderr().read(&mut stderr_buffer) {
                Ok(0) => {
                    // stderr结束
                }
                Ok(n) => {
                    has_data = true;
                    let chunk = String::from_utf8_lossy(&stderr_buffer[..n]);
                    stderr_line_buffer.push_str(&chunk);

                    // 处理stderr的完整行
                    while let Some(newline_pos) = stderr_line_buffer.find('\n') {
                        let line = stderr_line_buffer[..newline_pos].trim();
                        if !line.is_empty() {
                            // 过滤掉不重要的警告
                            if line.contains("LIBARCHIVE.xattr.com.apple.provenance") ||
                               line.contains("tar: Ignoring unknown extended header keyword") {
                                // 静默忽略这些macOS特定的警告
                                continue;
                            }

                            // Docker构建的stderr通常包含重要信息
                            if command.contains("docker build") {
                                self.emit_log("warning", &format!("🔧 {}", line), Some(step)).await;
                            } else {
                                self.emit_log("warning", &format!("⚠️  {}", line), Some(step)).await;
                            }
                        }
                        stderr_line_buffer = stderr_line_buffer[newline_pos + 1..].to_string();
                    }
                }
                Err(_) => {
                    // stderr读取错误或无数据
                }
            }

            // 检查通道是否已关闭
            if channel.eof() {
                break;
            }

            // 如果没有数据，短暂休眠避免CPU占用过高
            if !has_data {
                tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            }
        }

        // 处理剩余的缓冲区内容
        if !line_buffer.trim().is_empty() {
            let remaining = line_buffer.trim();
            if command.contains("docker build") {
                self.emit_log("info", &format!("🐳 {}", remaining), Some(step)).await;
            } else {
                self.emit_log("info", &format!("📤 {}", remaining), Some(step)).await;
            }
        }

        if !stderr_line_buffer.trim().is_empty() {
            let remaining = stderr_line_buffer.trim();
            self.emit_log("warning", &format!("⚠️  {}", remaining), Some(step)).await;
        }

        channel.wait_close()?;
        let exit_status = channel.exit_status()?;

        if exit_status != 0 {
            let error_msg = format!("命令执行失败 (退出码: {})", exit_status);
            self.emit_log("error", &error_msg, Some(step)).await;
            return Err(anyhow::anyhow!("{}", error_msg));
        }

        // 命令成功完成的日志
        let output_lines = output.lines().count();
        if command.contains("docker build") {
            self.emit_log("success", &format!("🎉 Docker镜像构建完成，共处理 {} 行输出", output_lines), Some(step)).await;
        } else {
            self.emit_log("success", &format!("✅ 命令执行完成，共输出 {} 行", output_lines), Some(step)).await;
        }

        Ok(output)
    }

    async fn emit_log(&self, level: &str, message: &str, step: Option<&str>) {
        let log_message = DeployLogMessage {
            id: self.deploy_id.clone(),
            timestamp: Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            level: level.to_string(),
            message: message.to_string(),
            step: step.map(|s| s.to_string()),
        };

        let _ = self.app_handle.emit("deploy_log", &log_message);
    }

    async fn emit_progress(&self, step: &str, progress: f32, status: &str) {
        *self.current_step.lock().await = step.to_string();
        *self.progress.lock().await = progress;

        let progress_message = DeployProgress {
            id: self.deploy_id.clone(),
            current_step: step.to_string(),
            progress,
            status: status.to_string(),
            error: None,
        };

        let _ = self.app_handle.emit("deploy_progress", &progress_message);
    }
}
