use crate::deploy_service::{DeployConfig, DeployService};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, State};
use tokio::sync::Mutex;

// 部署任务管理器
pub type DeployTasks = Arc<Mutex<HashMap<String, Arc<DeployService>>>>;

#[derive(Debug, Serialize)]
pub struct DeployResponse {
    pub success: bool,
    pub deploy_id: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct DeployRequest {
    pub config: DeployConfig,
}

#[tauri::command]
pub async fn deploy_with_config(
    app_handle: AppHandle,
    tasks: State<'_, DeployTasks>,
    request: DeployRequest,
) -> Result<DeployResponse, String> {
    // 创建新的部署服务
    let deploy_service = Arc::new(DeployService::new(app_handle, request.config));
    let deploy_id = deploy_service.get_deploy_id().to_string();
    
    // 将任务添加到管理器中
    {
        let mut tasks_lock = tasks.lock().await;
        tasks_lock.insert(deploy_id.clone(), deploy_service.clone());
    }

    // 在后台启动部署任务
    let service_clone = deploy_service.clone();
    let tasks_clone = tasks.inner().clone();
    let deploy_id_clone = deploy_id.clone();
    
    tokio::spawn(async move {
        let result = service_clone.start_deployment().await;
        
        // 部署完成后从管理器中移除任务
        {
            let mut tasks_lock = tasks_clone.lock().await;
            tasks_lock.remove(&deploy_id_clone);
        }
        
        if let Err(e) = result {
            eprintln!("部署失败: {}", e);
        }
    });

    Ok(DeployResponse {
        success: true,
        deploy_id,
        message: "部署任务已启动".to_string(),
    })
}

#[tauri::command]
pub async fn get_deploy_status(
    tasks: State<'_, DeployTasks>,
    deploy_id: String,
) -> Result<Option<String>, String> {
    let tasks_lock = tasks.lock().await;
    if let Some(service) = tasks_lock.get(&deploy_id) {
        let current_step = service.get_current_step().await;
        Ok(Some(current_step))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn cancel_deploy(
    tasks: State<'_, DeployTasks>,
    deploy_id: String,
) -> Result<bool, String> {
    let mut tasks_lock = tasks.lock().await;
    if tasks_lock.remove(&deploy_id).is_some() {
        Ok(true)
    } else {
        Ok(false)
    }
}
