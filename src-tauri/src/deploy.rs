use anyhow::{Context, Result};
use chrono::Utc;
use clap::Parser;
use git2::{Repository, Cred, RemoteCallbacks, FetchOptions};
use log::{error, info};
use serde::{Deserialize, Serialize};
use ssh2::Session;
use std::env;
use std::fs;
use std::io::prelude::*;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use uuid::Uuid;

// 颜色常量
struct Colors;
impl Colors {
    const RESET: &'static str = "\x1b[0m";
    const BLUE: &'static str = "\x1b[34m";
    const CYAN: &'static str = "\x1b[36m";
    const GRAY: &'static str = "\x1b[90m";
    const BRIGHT_GREEN: &'static str = "\x1b[92m";
    const BRIGHT_RED: &'static str = "\x1b[91m";
    const BRIGHT_YELLOW: &'static str = "\x1b[93m";
}

// 检查是否支持颜色输出
fn supports_color() -> bool {
    std::env::var("NO_COLOR").is_err()
        && (std::env::var("TERM").unwrap_or_default() != "dumb")
        && atty::is(atty::Stream::Stdout)
}

// 添加依赖到 Cargo.toml 的提示函数
fn colorize(text: &str, color: &str) -> String {
    if supports_color() {
        format!("{}{}{}", color, text, Colors::RESET)
    } else {
        text.to_string()
    }
}

#[derive(Debug, Deserialize, Serialize)]
struct Config {
    git: GitConfig,
    vm: VmConfig,
    docker: DockerConfig,
}

#[derive(Debug, Deserialize, Serialize)]
struct GitConfig {
    repo_url: String,
    branch: String,
    username: Option<String>,
    password: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct VmConfig {
    host: String,
    user: String,
    password: String,
    deploy_path: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct DockerConfig {
    image: String,
    container: String,
    port_mapping: String,
}

#[derive(Parser, Debug)]
#[command(name = "frontend-deploy")]
#[command(about = "前端部署脚本")]
struct Args {
    /// 配置文件路径
    #[arg(short, long)]
    config: String,

    /// Git仓库URL (覆盖配置文件)
    #[arg(short, long)]
    repo_url: Option<String>,

    /// 分支名称 (覆盖配置文件)
    #[arg(short, long)]
    branch: Option<String>,

    /// 虚拟机IP地址 (覆盖配置文件)
    #[arg(long)]
    vm_host: Option<String>,

    /// SSH用户名 (覆盖配置文件)
    #[arg(long)]
    vm_user: Option<String>,

    /// SSH密码 (覆盖配置文件)
    #[arg(long)]
    vm_password: Option<String>,

    /// 虚拟机上的部署目录 (覆盖配置文件)
    #[arg(long)]
    vm_deploy_path: Option<String>,

    /// Docker镜像名称 (覆盖配置文件)
    #[arg(long)]
    docker_image: Option<String>,

    /// Docker容器名称 (覆���配置文件)
    #[arg(long)]
    docker_container: Option<String>,

    /// 容器端口映射 (覆盖配置文件)
    #[arg(long)]
    port_mapping: Option<String>,
}

struct DeploymentLog {
    start_time: chrono::DateTime<Utc>,
    steps: Vec<String>,
    success: bool,
}

impl DeploymentLog {
    fn new() -> Self {
        Self {
            start_time: Utc::now(),
            steps: Vec::new(),
            success: false,
        }
    }

    fn add_step(&mut self, step: &str) {
        let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S");
        let log_entry = format!("[{}] {}", timestamp, step);
        self.steps.push(log_entry.clone());
        // 同时输出到日志和控制台，添加颜色
        info!("{}", log_entry);
        println!("{}", colorize(&log_entry, Colors::BLUE));
    }

    fn add_error(&mut self, error: &str) {
        let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S");
        let log_entry = format!("[{}] ERROR: {}", timestamp, error);
        self.steps.push(log_entry.clone());
        // 同时输出到日志和控制台，添加红色
        error!("{}", log_entry);
        eprintln!("{}", colorize(&log_entry, Colors::BRIGHT_RED));
    }

    fn add_info(&mut self, info: &str) {
        let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S");
        let log_entry = format!("[{}] INFO: {}", timestamp, info);
        self.steps.push(log_entry.clone());
        // 同时输出到日志和控制台，添加灰色（降低重要性）
        info!("{}", log_entry);

        // 过滤掉tar的macOS扩展属性警告
        if info.contains("LIBARCHIVE.xattr.com.apple.provenance") {
            // 不输出这些警告到控制台，只记录到日志
            return;
        }

        println!("{}", colorize(&log_entry, Colors::GRAY));
    }

    fn add_success(&mut self, message: &str) {
        let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S");
        let log_entry = format!("[{}] SUCCESS: {}", timestamp, message);
        self.steps.push(log_entry.clone());
        info!("{}", log_entry);
        println!("{}", colorize(&log_entry, Colors::BRIGHT_GREEN));
    }

    fn add_warning(&mut self, warning: &str) {
        let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S");
        let log_entry = format!("[{}] WARNING: {}", timestamp, warning);
        self.steps.push(log_entry.clone());
        info!("{}", log_entry);
        println!("{}", colorize(&log_entry, Colors::BRIGHT_YELLOW));
    }

    fn finish(&mut self, success: bool) {
        self.success = success;
        let duration = Utc::now().signed_duration_since(self.start_time);
        let status = if success { "成功" } else { "失败" };
        let final_log = format!("部署{}, 总耗时: {}秒", status, duration.num_seconds());

        if success {
            self.add_success(&final_log);
        } else {
            self.add_error(&final_log);
        }
    }

    fn print_summary(&self) {
        println!("\n{}", colorize("=== 部署日志摘要 ===", Colors::CYAN));
        for step in &self.steps {
            if step.contains("ERROR:") {
                println!("{}", colorize(step, Colors::BRIGHT_RED));
            } else if step.contains("SUCCESS:") {
                println!("{}", colorize(step, Colors::BRIGHT_GREEN));
            } else if step.contains("WARNING:") {
                println!("{}", colorize(step, Colors::BRIGHT_YELLOW));
            } else {
                println!("{}", step);
            }
        }
        println!("{}\n", colorize("==================", Colors::CYAN));
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

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();
    let args = Args::parse();
    let mut deploy_log = DeploymentLog::new();

    deploy_log.add_step("开始前端部署流程");

    // 读取配置文件
    let config = load_config(&args.config, &mut deploy_log)?;

    // 合并配置文件和命令行参数
    let final_config = merge_config(config, &args);

    // 步骤1: 克隆Git仓库 (支持认证) - 使用系统临时目录
    let local_path = get_temp_dir()?;
    deploy_log.add_step(&format!("使用临时目录: {}", local_path));

    match clone_repository_with_auth(
        &final_config.git.repo_url,
        &final_config.git.branch,
        &final_config.git.username,
        &final_config.git.password,
        &local_path,
        &mut deploy_log,
    ) {
        Ok(_) => {}
        Err(e) => {
            deploy_log.add_error(&format!("Git克隆失败: {}", e));
            deploy_log.finish(false);
            deploy_log.print_summary();
            return Err(e);
        }
    }

    // 步骤2-5: SSH连接并执行部署
    let deployment_result = deploy_to_vm(
        &final_config.vm.host,
        &final_config.vm.user,
        &final_config.vm.password,
        &local_path,
        &final_config.vm.deploy_path,
        &final_config.docker.image,
        &final_config.docker.container,
        &final_config.docker.port_mapping,
        &mut deploy_log,
    )
    .await;

    // 步骤6: 清理本地文件
    cleanup_local_files(&local_path, &mut deploy_log);

    match deployment_result {
        Ok(_) => {
            deploy_log.finish(true);
            deploy_log.print_summary();
            Ok(())
        }
        Err(e) => {
            deploy_log.finish(false);
            deploy_log.print_summary();
            Err(e)
        }
    }
}

fn load_config(config_path: &str, deploy_log: &mut DeploymentLog) -> Result<Config> {
    deploy_log.add_step(&format!("读取配置文件: {}", config_path));

    let config_content = fs::read_to_string(config_path)
        .context(format!("无法读取配置文件: {}", config_path))?;

    let config: Config = toml::from_str(&config_content)
        .context("配置文件格式错误")?;

    deploy_log.add_step("配置文件读取成功");
    Ok(config)
}

fn merge_config(mut config: Config, args: &Args) -> Config {
    // 命令行参数覆盖配置文件
    if let Some(repo_url) = &args.repo_url {
        config.git.repo_url = repo_url.clone();
    }
    if let Some(branch) = &args.branch {
        config.git.branch = branch.clone();
    }
    if let Some(vm_host) = &args.vm_host {
        config.vm.host = vm_host.clone();
    }
    if let Some(vm_user) = &args.vm_user {
        config.vm.user = vm_user.clone();
    }
    if let Some(vm_password) = &args.vm_password {
        config.vm.password = vm_password.clone();
    }
    if let Some(vm_deploy_path) = &args.vm_deploy_path {
        config.vm.deploy_path = vm_deploy_path.clone();
    }
    if let Some(docker_image) = &args.docker_image {
        config.docker.image = docker_image.clone();
    }
    if let Some(docker_container) = &args.docker_container {
        config.docker.container = docker_container.clone();
    }
    if let Some(port_mapping) = &args.port_mapping {
        config.docker.port_mapping = port_mapping.clone();
    }

    config
}

fn clone_repository_with_auth(
    repo_url: &str,
    branch: &str,
    username: &Option<String>,
    password: &Option<String>,
    local_path: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    deploy_log.add_step(&format!("正在克隆仓库: {} (分���: {})", repo_url, branch));

    let repo = if username.is_some() && password.is_some() {
        deploy_log.add_step("使用认证信息克隆仓库");

        // 设置认证回调
        let mut callbacks = RemoteCallbacks::new();
        let username = username.as_ref().unwrap().clone();
        let password = password.as_ref().unwrap().clone();

        callbacks.credentials(move |_url, username_from_url, _allowed_types| {
            let user = username_from_url.unwrap_or(&username);
            Cred::userpass_plaintext(user, &password)
        });

        let mut fetch_options = FetchOptions::new();
        fetch_options.remote_callbacks(callbacks);

        let mut builder = git2::build::RepoBuilder::new();
        builder.fetch_options(fetch_options);
        builder.clone(repo_url, Path::new(local_path))?
    } else {
        deploy_log.add_step("使用公开方式克隆仓库");
        Repository::clone(repo_url, local_path)?
    };

    // 只允许检出指定分支，不存在则直接报错
    let local_branch_ref = format!("refs/heads/{}", branch);
    let remote_branch_ref = format!("refs/remotes/origin/{}", branch);

    if repo.find_reference(&local_branch_ref).is_ok() {
        // 本地分支存在，直接切换
        let (object, reference) = repo.revparse_ext(branch)?;
        repo.checkout_tree(&object, None)?;
        if let Some(gref) = reference {
            repo.set_head(gref.name().unwrap())?;
        } else {
            repo.set_head_detached(object.id())?;
        }
    } else if let Ok(remote_ref) = repo.find_reference(&remote_branch_ref) {
        // 远端分支存在，创建本地分支并切换
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
        // 分支不存在，直接报错
        return Err(anyhow::anyhow!(
            "分支 '{}' 不存在于本地或远端仓库，请检查分支名称是否正确",
            branch
        ));
    }

    deploy_log.add_step(&format!("成功克隆到本地路径: {}", local_path));
    Ok(())
}

async fn deploy_to_vm(
    host: &str,
    username: &str,
    password: &str,
    local_path: &str,
    remote_path: &str,
    image_name: &str,
    container_name: &str,
    port_mapping: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    deploy_log.add_step(&format!("正在连接虚拟机: {}@{}", username, host));

    // 建立SSH连接
    let tcp = TcpStream::connect(format!("{}:22", host)).context("无法连接到虚拟机")?;
    let mut sess = Session::new()?;
    sess.set_tcp_stream(tcp);
    sess.handshake()?;
    sess.userauth_password(username, password)
        .context("SSH认证失败")?;

    deploy_log.add_step("SSH连接成功");

    // 创建远程目录
    let create_dir_cmd = format!("mkdir -p {}", remote_path);
    execute_ssh_command(&sess, &create_dir_cmd, deploy_log)?;

    // 上传文件
    upload_directory(&sess, local_path, remote_path, deploy_log)?;

    // 构建Docker镜像
    build_docker_image(&sess, remote_path, image_name, deploy_log)?;

    // 停止并删除旧容器
    stop_and_remove_container(&sess, container_name, deploy_log)?;

    // 运行新容器
    run_docker_container(&sess, image_name, container_name, port_mapping, deploy_log)?;

    // 清理虚拟机上的部署目录
    cleanup_remote_files(&sess, remote_path, deploy_log)?;

    deploy_log.add_step("虚拟机部署完成");
    Ok(())
}

fn execute_ssh_command(
    sess: &Session,
    command: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<String> {
    deploy_log.add_step(&format!("执行命令: {}", command));
    println!("    → {}", command); // 实时显示正在执行的命令

    let mut channel = sess.channel_session()?;
    channel.exec(command)?;

    let mut output = String::new();
    let mut buffer = [0; 1024]; // 减小缓冲区以提高实时性
    let mut line_buffer = String::new();

    // 实时读取和显示输出
    loop {
        // 尝试从标准输出读取
        match channel.read(&mut buffer) {
            Ok(0) => {
                // 检查是否还有stderr数据
                let mut stderr_buffer = [0; 1024];
                match channel.stderr().read(&mut stderr_buffer) {
                    Ok(0) => break, // 真正的EOF
                    Ok(n) => {
                        let chunk = String::from_utf8_lossy(&stderr_buffer[..n]);
                        print!("{}", chunk);
                        std::io::stdout().flush().unwrap();
                        line_buffer.push_str(&chunk);

                        // 处理完整行的日志
                        while let Some(newline_pos) = line_buffer.find('\n') {
                            let line = line_buffer[..newline_pos].trim();
                            if !line.is_empty() {
                                deploy_log.add_info(&format!("STDERR: {}", line));
                            }
                            line_buffer = line_buffer[newline_pos + 1..].to_string();
                        }
                    }
                    Err(_) => break,
                }
            }
            Ok(n) => {
                let chunk = String::from_utf8_lossy(&buffer[..n]);
                output.push_str(&chunk);
                print!("{}", chunk);
                std::io::stdout().flush().unwrap();

                line_buffer.push_str(&chunk);

                // 处理完整行的日志
                while let Some(newline_pos) = line_buffer.find('\n') {
                    let line = line_buffer[..newline_pos].trim();
                    if !line.is_empty() {
                        deploy_log.add_info(&format!("STDOUT: {}", line));
                    }
                    line_buffer = line_buffer[newline_pos + 1..].to_string();
                }
            }
            Err(e) => {
                // 如果是EAGAIN (Would block)，继续尝试读取stderr
                let mut stderr_buffer = [0; 1024];
                match channel.stderr().read(&mut stderr_buffer) {
                    Ok(0) => break,
                    Ok(n) => {
                        let chunk = String::from_utf8_lossy(&stderr_buffer[..n]);
                        print!("{}", chunk);
                        std::io::stdout().flush().unwrap();
                        line_buffer.push_str(&chunk);

                        // 处理完整行的日志
                        while let Some(newline_pos) = line_buffer.find('\n') {
                            let line = line_buffer[..newline_pos].trim();
                            if !line.is_empty() {
                                deploy_log.add_info(&format!("STDERR: {}", line));
                            }
                            line_buffer = line_buffer[newline_pos + 1..].to_string();
                        }
                    }
                    Err(_) => {
                        deploy_log.add_error(&format!("读取命令输出时出错: {}", e));
                        break;
                    }
                }
            }
        }

        // 检查通道是否已关闭
        if channel.eof() {
            break;
        }

        // 短暂休眠避免CPU占用过高
        std::thread::sleep(std::time::Duration::from_millis(10));
    }

    // 处理剩余的行缓冲
    if !line_buffer.trim().is_empty() {
        deploy_log.add_info(&format!("剩余输出: {}", line_buffer.trim()));
    }

    // 读取任何剩余的错误输出
    let mut error_output = String::new();
    let _ = channel.stderr().read_to_string(&mut error_output);

    channel.wait_close()?;
    let exit_status = channel.exit_status()?;

    if exit_status != 0 {
        deploy_log.add_error(&format!("命令执行失败 (退出码: {})", exit_status));
        if !error_output.trim().is_empty() {
            deploy_log.add_error(&format!("错误输出: {}", error_output.trim()));
            eprintln!("    错误输出: {}", error_output.trim());
        }
        return Err(anyhow::anyhow!("命令执行失败: {}", error_output));
    }

    let output_lines = output.lines().count();
    if output_lines > 0 {
        deploy_log.add_info(&format!("命令执行完成，共输出 {} 行", output_lines));
    } else {
        deploy_log.add_info("命令执行完成，无标准输出");
    }

    Ok(output)
}

fn upload_directory(
    sess: &Session,
    local_path: &str,
    remote_path: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    deploy_log.add_step(&format!("开始上传文件到: {}", remote_path));

    // 方法1: 尝试使用tar打包传输（推荐）
    match upload_via_tar(sess, local_path, remote_path, deploy_log) {
        Ok(_) => {
            deploy_log.add_step("��件上传完成（使用tar方式）");
            return Ok(());
        }
        Err(e) => {
            deploy_log.add_info(&format!("tar方式失败，回退到逐个文件上传: {}", e));
        }
    }

    // 方法2: 回退到原有的递归上传方式
    upload_dir_recursive(sess, Path::new(local_path), remote_path, deploy_log)?;
    deploy_log.add_step("文件上传完成（使用逐个文件方式）");
    Ok(())
}

fn upload_via_tar(
    sess: &Session,
    local_path: &str,
    remote_path: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    use std::process::Command;

    deploy_log.add_step("使用tar打包方式上传文件");

    // 步骤1: 创建远程目录
    let create_dir_cmd = format!("mkdir -p {}", remote_path);
    execute_ssh_command(sess, &create_dir_cmd, deploy_log)?;

    // 步骤2: 本地创建tar包（使用跨平台临时目录）
    let temp_tar = if cfg!(target_os = "windows") {
        let temp_dir = env::var("TEMP").unwrap_or_else(|_| "C:\\Windows\\Temp".to_string());
        format!("{}\\deploy_temp.tar.gz", temp_dir)
    } else {
        "/tmp/deploy_temp.tar.gz".to_string()
    };
    deploy_log.add_step("正在本地创建tar包...");

    // 在macOS上，添加--no-xattrs参数来避免扩展属性警告
    let mut tar_args = vec![
        "-czf",
        &temp_tar,
        "--exclude",
        ".git",
        "--exclude",
        ".gitignore",
        "--exclude",
        ".DS_Store",  // 排除macOS系统文件
    ];

    // 检测操作系统，如果是macOS则添加--no-xattrs参数
    if cfg!(target_os = "macos") {
        tar_args.push("--no-xattrs");  // 避免macOS扩展属性
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

    deploy_log.add_step(&format!("tar包创建完成: {}", temp_tar));

    // 步骤3: 通过SSH传输tar包
    deploy_log.add_step("正在传输tar包到远程服务器...");

    let tar_data = std::fs::read(temp_tar)?;
    let remote_tar = format!("{}/deploy_temp.tar.gz", remote_path);

    let mut remote_file = sess.scp_send(Path::new(&remote_tar), 0o644, tar_data.len() as u64, None)?;
    remote_file.write_all(&tar_data)?;
    remote_file.send_eof()?;
    remote_file.wait_eof()?;
    remote_file.close()?;
    remote_file.wait_close()?;

    deploy_log.add_step("tar包传输完成");

    // 步骤4: 在远程服务器解压，并忽略扩展属性警告
    deploy_log.add_step("正在远程解压tar包...");
    let extract_cmd = format!(
        "cd {} && tar -xzf deploy_temp.tar.gz 2>/dev/null || tar -xzf deploy_temp.tar.gz && rm -f deploy_temp.tar.gz",
        remote_path
    );
    execute_ssh_command(sess, &extract_cmd, deploy_log)?;

    // 步骤5: 清理本地临时文件
    std::fs::remove_file(temp_tar)?;
    deploy_log.add_step("清理临时文件完成");

    Ok(())
}

// 保留原有的递归上传方法作为备用
fn upload_dir_recursive(
    sess: &Session,
    local_dir: &Path,
    remote_base: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    // 首先批量创建所有需要的目录
    let mut dirs_to_create = Vec::new();
    let mut files_to_upload = Vec::new();

    collect_dirs_and_files(local_dir, remote_base, &mut dirs_to_create, &mut files_to_upload)?;

    // 批量创建目录（减少SSH命令调用次数）
    if !dirs_to_create.is_empty() {
        deploy_log.add_step(&format!("批量创建 {} 个目录", dirs_to_create.len()));
        let create_dirs_cmd = format!("mkdir -p {}", dirs_to_create.join(" "));
        execute_ssh_command(sess, &create_dirs_cmd, deploy_log)?;
    }

    // 上传文件 - 先保存总数，然后使用引用迭代
    let total_files = files_to_upload.len();
    deploy_log.add_step(&format!("开始上传 {} 个文件", total_files));
    let mut uploaded_count = 0;

    for (local_file, remote_file) in &files_to_upload {
        let local_content = fs::read(&local_file)?;
        let mut remote_file_handle = sess.scp_send(
            Path::new(&remote_file),
            0o644,
            local_content.len() as u64,
            None,
        )?;

        remote_file_handle.write_all(&local_content)?;
        remote_file_handle.send_eof()?;
        remote_file_handle.wait_eof()?;
        remote_file_handle.close()?;
        remote_file_handle.wait_close()?;

        uploaded_count += 1;
        if uploaded_count % 10 == 0 {
            deploy_log.add_info(&format!("已上传 {}/{} 个文件", uploaded_count, total_files));
        }
    }

    Ok(())
}

fn collect_dirs_and_files(
    local_dir: &Path,
    remote_base: &str,
    dirs_to_create: &mut Vec<String>,
    files_to_upload: &mut Vec<(PathBuf, String)>,
) -> Result<()> {
    for entry in fs::read_dir(local_dir)? {
        let entry = entry?;
        let local_path = entry.path();
        let file_name = local_path.file_name().unwrap().to_str().unwrap();

        // 跳过 .git 目录和其他不需要的文件
        if file_name == ".git" || file_name.starts_with('.') && file_name != ".gitignore" {
            continue;
        }

        let remote_path = format!("{}/{}", remote_base, file_name);

        if local_path.is_dir() {
            dirs_to_create.push(remote_path.clone());
            collect_dirs_and_files(&local_path, &remote_path, dirs_to_create, files_to_upload)?;
        } else {
            files_to_upload.push((local_path, remote_path));
        }
    }

    Ok(())
}

fn build_docker_image(
    sess: &Session,
    remote_path: &str,
    image_name: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    deploy_log.add_step(&format!("开始构建Docker镜像: {}", image_name));

    let build_cmd = format!("cd {} && docker build -t {} .", remote_path, image_name);
    execute_ssh_command(sess, &build_cmd, deploy_log)?;

    deploy_log.add_step("Docker镜像构建完成");
    Ok(())
}

fn stop_and_remove_container(
    sess: &Session,
    container_name: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    deploy_log.add_step(&format!("停止并删除旧容器: {}", container_name));

    // 停止容器 (忽略错误，因为容器可能不存在)
    let stop_cmd = format!("docker stop {} || true", container_name);
    let _ = execute_ssh_command(sess, &stop_cmd, deploy_log);

    // 删除容器 (忽略错误，因为容器可能不存在)
    let remove_cmd = format!("docker rm {} || true", container_name);
    let _ = execute_ssh_command(sess, &remove_cmd, deploy_log);

    Ok(())
}

fn run_docker_container(
    sess: &Session,
    image_name: &str,
    container_name: &str,
    port_mapping: &str,
    deploy_log: &mut DeploymentLog,
) -> Result<()> {
    deploy_log.add_step(&format!("启动Docker容器: {}", container_name));

    let run_cmd = format!(
        "docker run -d --name {} -p {} {}",
        container_name, port_mapping, image_name
    );
    execute_ssh_command(sess, &run_cmd, deploy_log)?;

    // 检查容器状态
    let status_cmd = format!("docker ps --filter name={} --format '{{{{.Status}}}}'", container_name);
    let status_output = execute_ssh_command(sess, &status_cmd, deploy_log)?;

    if status_output.trim().is_empty() {
        deploy_log.add_error("容器启动失败");
        return Err(anyhow::anyhow!("容器启动失败"));
    }

    deploy_log.add_step(&format!("容器启动成功，状态: {}", status_output.trim()));
    Ok(())
}

fn cleanup_local_files(local_path: &str, deploy_log: &mut DeploymentLog) {
    deploy_log.add_step(&format!("清理本地临时文件: {}", local_path));

    match fs::remove_dir_all(local_path) {
        Ok(_) => deploy_log.add_step("本地文件清理完成"),
        Err(e) => deploy_log.add_error(&format!("清理本地文件失败: {}", e)),
    }
}

fn cleanup_remote_files(sess: &Session, remote_path: &str, deploy_log: &mut DeploymentLog) -> Result<()> {
    deploy_log.add_step(&format!("清理虚拟机部署目录: {}", remote_path));

    // 删除远程目录及其内容
    let delete_cmd = format!("rm -rf {}", remote_path);
    execute_ssh_command(sess, &delete_cmd, deploy_log)?;

    deploy_log.add_step("虚拟机部署目录清理完成");
    Ok(())
}
