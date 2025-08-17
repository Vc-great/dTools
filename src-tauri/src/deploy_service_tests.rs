#[cfg(test)]
mod tests {
    use crate::deploy_service::{DeployConfig, GitConfig, VmConfig, DockerConfig, DeployLogMessage, DeployProgress};
    use tempfile::TempDir;

    // 创建测试配置
    fn create_test_config() -> DeployConfig {
        DeployConfig {
            git: GitConfig {
                repo_url: "https://github.com/octocat/Hello-World.git".to_string(),
                branch: "main".to_string(),
                username: None,
                password: None,
            },
            vm: VmConfig {
                host: "127.0.0.1".to_string(),
                user: "testuser".to_string(),
                password: "testpass".to_string(),
                deploy_path: "/tmp/test_deploy".to_string(),
            },
            docker: DockerConfig {
                image: "test-app:latest".to_string(),
                container: "test-container".to_string(),
                port_mapping: "8080:80".to_string(),
            },
        }
    }

    #[test]
    fn test_deploy_log_message_creation() {
        let log_message = DeployLogMessage {
            id: "test-id".to_string(),
            timestamp: "2024-01-01 12:00:00".to_string(),
            level: "info".to_string(),
            message: "Test message".to_string(),
            step: Some("test-step".to_string()),
        };

        assert_eq!(log_message.level, "info");
        assert_eq!(log_message.message, "Test message");
        assert_eq!(log_message.step, Some("test-step".to_string()));
    }

    #[test]
    fn test_deploy_progress_creation() {
        let progress = DeployProgress {
            id: "test-id".to_string(),
            current_step: "测试步骤".to_string(),
            progress: 50.0,
            status: "running".to_string(),
            error: None,
        };

        assert_eq!(progress.progress, 50.0);
        assert_eq!(progress.status, "running");
        assert_eq!(progress.error, None);
    }

    // 集成测试 - 测试Git克隆功能（需要网络连接）
    #[tokio::test]
    #[ignore] // 使用 cargo test -- --ignored 来运行这个测试
    async fn test_git_clone_integration() {
        let temp_dir = TempDir::new().unwrap();
        let local_path = temp_dir.path().join("test_repo");

        // 测试克隆公共仓库
        let result = std::process::Command::new("git")
            .args(&["clone", "https://github.com/octocat/Hello-World.git"])
            .arg(&local_path)
            .output();

        match result {
            Ok(output) => {
                assert!(output.status.success());
                assert!(local_path.exists());
                assert!(local_path.join(".git").exists());
            }
            Err(e) => {
                println!("Git clone test skipped: {}", e);
            }
        }
    }

    // 单元测试 - 测试配置验证
    #[test]
    fn test_config_validation() {
        let config = create_test_config();

        // 验证必填字段
        assert!(!config.git.repo_url.is_empty());
        assert!(!config.git.branch.is_empty());
        assert!(!config.vm.host.is_empty());
        assert!(!config.vm.user.is_empty());
        assert!(!config.docker.image.is_empty());
        assert!(!config.docker.container.is_empty());
    }

    // 测试tar命令构建（模拟）
    #[test]
    fn test_tar_command_construction() {
        let local_path = "/tmp/test";
        let temp_tar = "/tmp/test.tar.gz";

        let mut tar_args = vec![
            "-czf",
            temp_tar,
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

        // 验证命令参数
        assert!(tar_args.contains(&"-czf"));
        assert!(tar_args.contains(&"--exclude"));
        assert!(tar_args.contains(&".git"));

        if cfg!(target_os = "macos") {
            assert!(tar_args.contains(&"--no-xattrs"));
        }
    }

    // 性能测试 - 测试大量日志消息的处理
    #[test]
    fn test_log_message_performance() {
        let start = std::time::Instant::now();

        let mut messages = Vec::new();
        for i in 0..1000 {
            let log_message = DeployLogMessage {
                id: format!("test-{}", i),
                timestamp: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
                level: "info".to_string(),
                message: format!("Test message {}", i),
                step: Some("performance-test".to_string()),
            };
            messages.push(log_message);
        }

        let duration = start.elapsed();
        println!("Created 1000 log messages in {:?}", duration);

        // 验证性能在合理范围内（应该很快）
        assert!(duration.as_millis() < 100);
        assert_eq!(messages.len(), 1000);
    }

    // 测试配置文件格式
    #[test]
    fn test_toml_config_parsing() {
        let toml_str = r#"
[git]
repo_url = "https://github.com/test/repo.git"
branch = "main"
username = "user"
password = "pass"

[vm]
host = "192.168.1.100"
user = "root"
password = "secret"
deploy_path = "/opt/app"

[docker]
image = "myapp:latest"
container = "myapp-container"
port_mapping = "8080:80"
"#;

        let config: Result<DeployConfig, _> = toml::from_str(toml_str);
        assert!(config.is_ok());

        let config = config.unwrap();
        assert_eq!(config.git.repo_url, "https://github.com/test/repo.git");
        assert_eq!(config.vm.host, "192.168.1.100");
        assert_eq!(config.docker.image, "myapp:latest");
    }
}
