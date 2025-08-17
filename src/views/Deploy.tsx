import Editor from '@monaco-editor/react';
import {useState, useEffect, useCallback, useRef, memo} from "react";
import { load } from 'js-toml';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@tauri-apps/api/core';

// 默认配置
const defaultTomlContent = `
# 部署配置
[git]
repo_url = ""
branch = ""
# Git认证信息 (用于HTTPS仓库)
username = ""
password = ""

[vm]
host = ""
user = ""
password = ""
deploy_path = ""

[docker]
image = ""
container = ""
port_mapping = ""
`;

interface DeployLogMessage {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    step?: string;
}

interface DeployProgress {
    id: string;
    current_step: string;
    progress: number;
    status: string;
    error?: string;
}

interface LogItemProps {
    log: DeployLogMessage;
    index: number;
    getLogLevelColor: (level: string) => string;
}

// 将 LogItem 移到组件外部，使用 memo 优化
const LogItem = memo(({ log, index, getLogLevelColor }: LogItemProps) => (
    <div key={`${log.id}-${index}`} style={{ marginBottom: '4px' }}>
        <span style={{ color: '#666' }}>[{log.timestamp}]</span>
        {log.step && (
            <span style={{ color: '#569cd6', marginLeft: '8px' }}>
                [{log.step}]
            </span>
        )}
        <span style={{
            color: getLogLevelColor(log.level),
            marginLeft: '8px',
            fontWeight: log.level === 'error' ? 'bold' : 'normal'
        }}>
            {log.message}
        </span>
    </div>
));

export default function DeployPage() {
    const [tomlText, setTomlText] = useState(defaultTomlContent.trim());
    const [error, setError] = useState<string | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [logs, setLogs] = useState<DeployLogMessage[]>([]);
    const [progress, setProgress] = useState<DeployProgress | null>(null);
    // 移除 isLoading 状态，直接设置为 false
    const [editorMounted, setEditorMounted] = useState(false);

    const logsEndRef = useRef<HTMLDivElement>(null);
    // 使用 ref 来避免闭包问题
    const unlistenersRef = useRef<{
        log: UnlistenFn | null;
        progress: UnlistenFn | null;
    }>({ log: null, progress: null });

    const logsContainerRef = useRef<HTMLDivElement>(null);

    // 将 getLogLevelColor 移到组件内，使用 useCallback 优化
    const getLogLevelColor = useCallback((level: string) => {
        switch (level) {
            case 'error': return '#ff4d4f';
            case 'warning': return '#faad14';
            case 'success': return '#52c41a';
            case 'info': return '#1890ff';
            default: return '#666';
        }
    }, []);

    const getProgressColor = useCallback((status: string) => {
        switch (status) {
            case 'error': return '#ff4d4f';
            case 'success': return '#52c41a';
            default: return '#1890ff';
        }
    }, []);




    // 优化的事件处理函数 - 防止重新渲染
    const handleLogMessage = useCallback((event: { payload: DeployLogMessage }) => {
        const logMessage = event.payload;

       if(logMessage.step === '完成'|| logMessage.step === '错误') {
           setIsDeploying(false)
       }

        // 使用函数式更新避免闭包问题
        setLogs(prev => {
            // 防止重复添加相同的日志
            const isDuplicate = prev.some(log =>
                log.id === logMessage.id &&
                log.timestamp === logMessage.timestamp &&
                log.message === logMessage.message
            );

            if (isDuplicate) {
                return prev;
            }

            const newLogs = [...prev, logMessage];
            // 限制日志数量，避免内存问题
            if (newLogs.length > 1000) {
                return newLogs.slice(-1000);
            }

            return newLogs;
        });

        // 延迟滚动，避免频繁操作DOM
        requestAnimationFrame(() => {
            if (logsContainerRef.current) {
               // logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;

            }
        });
    }, []);

    // 设置事件监听器 - 只在组件挂载时设置一次
    useEffect(() => {
        // 只在 Tauri 环境中设置事件监听器
        if (!isTauri()) {
            console.log('非 Tauri 环境，跳过事件监听器设置');
            return;
        }

        let mounted = true;
        let unlistenLog: UnlistenFn | null = null;
        let unlistenProgress: UnlistenFn | null = null;

        const setupListeners = async () => {
            try {
                console.log('正在设置事件监听器...');

                // 监听部署日志事件
                unlistenLog = await listen<DeployLogMessage>('deploy_log', handleLogMessage);

                if (mounted) {
                    console.log('事件监听器设置成功');
                }
            } catch (err) {
                console.error('设置事件监听器失败:', err);
            }
        };

        setupListeners();

        return () => {
            mounted = false;
            // 使用更安全的清理方式
            const cleanup = async () => {
                try {
                    if (unlistenLog && typeof unlistenLog === 'function') {
                        await unlistenLog();
                    }
                    console.log('事件监听器已清理');
                } catch (err) {
                    // 静默处理清理错误
                    console.warn('清理事件监听器时出现警告:', err);
                }
            };
            cleanup();
        };
    }, []);


    async function handleSave() {
        try {
            const config = load(tomlText);
            console.log("-> 配置信息", config);

            // 只在 Tauri 环境中进行文件操作和部署
            if (!isTauri()) {
                setError('请在 Tauri 桌面应用中使用部署功能');
                return;
            }

            // 清空之前的日志和进度
            console.log('清空日志和进度状态');
            setLogs([]);
            setIsDeploying(true);
            setError(null);

            console.log('开始调用部署命令...');
            // 调用Tauri命令开始部署
            const response = await invoke('deploy_with_config', {
                request: { config }
            });

            console.log("部署响应:", response);

        } catch (e: any) {
            console.error('部署启动失败:', e);
            setError(e.message || '部署启动失败');
            setIsDeploying(false);
        }
    }


    useEffect(() => {
        if (logsContainerRef.current && logsContainerRef.current.scrollHeight !== undefined) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [logs,logsContainerRef]);

    // Monaco Editor 配置
    const editorOptions = {
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        theme: 'vs-dark',
        automaticLayout: true,
        wordWrap: 'on' as const,
        lineNumbers: 'on' as const,
        folding: true,
        renderLineHighlight: 'line' as const,
        selectOnLineNumbers: true,
        matchBrackets: 'always' as const,
    };

    const handleEditorDidMount = (editor: any, monaco: any) => {
        console.log('Monaco Editor mounted successfully');
        setEditorMounted(true);

        // 配置TOML语言支持
        monaco.languages.register({ id: 'toml' });
        monaco.languages.setMonarchTokensProvider('toml', {
            tokenizer: {
                root: [
                    [/\[.*\]/, 'custom-section'],
                    [/#.*$/, 'comment'],
                    [/.*=/, 'key'],
                    [/".*"/, 'string'],
                    [/\d+/, 'number'],
                ]
            }
        });

        // 设置主题
        monaco.editor.defineTheme('toml-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'custom-section', foreground: '569cd6' },
                { token: 'comment', foreground: '6a9955' },
                { token: 'key', foreground: '9cdcfe' },
                { token: 'string', foreground: 'ce9178' },
                { token: 'number', foreground: 'b5cea8' },
            ],
            colors: {
                'editor.background': '#1e1e1e',
            }
        });

        monaco.editor.setTheme('toml-theme');
    };

    const handleEditorBeforeMount = (monaco: any) => {
        console.log('Monaco Editor before mount');
        // 在这里可以进行一些预配置
    };

    return (
        <div className="Deploy" style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2>部署配置</h2>

                {/* 调试信息 - 生产环境可以移除 */}
                {!editorMounted && (
                    <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        color: '#856404',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '10px'
                    }}>
                        Monaco Editor 正在加载...
                    </div>
                )}

                <div style={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    height: '400px',
                    overflow: 'hidden'
                }}>
                    <Editor
                        height="400px"
                        language="toml"
                        value={tomlText}
                        onChange={value => setTomlText(value ?? '')}
                        options={editorOptions}
                        onMount={handleEditorDidMount}
                        beforeMount={handleEditorBeforeMount}
                        loading={
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '400px',
                                background: '#1e1e1e',
                                color: '#fff'
                            }}>
                                <div>Loading Monaco Editor...</div>
                            </div>
                        }
                    />
                </div>

                {/* 回退方案：如果Monaco Editor加载失败，显示普通文本区域 */}
                {!editorMounted && (
                    <textarea
                        value={tomlText}
                        onChange={(e) => setTomlText(e.target.value)}
                        style={{
                            width: '100%',
                            height: '300px',
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            fontSize: '14px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '10px',
                            marginTop: '10px'
                        }}
                        placeholder="TOML 配置内容..."
                    />
                )}

                {error && (
                    <div style={{
                        color: '#ff4d4f',
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '10px'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginTop: '10px' }}>
                    <button
                        onClick={handleSave}
                        disabled={isDeploying}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: isDeploying ? '#d9d9d9' : '#1890ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isDeploying ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isDeploying ? '部署中...' : '保存并部署'}
                    </button>
                </div>
            </div>

            {/* 实时日志显示 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3>部署日志 {logs.length > 0 && `(${logs.length})`}</h3>
                <div
                    ref={logsContainerRef}
                    style={{
                        flex: 1,
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: '10px',
                        borderRadius: '4px',
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '400px'
                    }}
                >
                    {logs.length === 0 ? (
                        <div style={{ color: '#666' }}>
                            {isDeploying ? '等待部署日志...' : '点击"保存并部署"开始部署'}
                        </div>
                    ) : (
                        logs.map((log, index) => (
                            <LogItem
                                key={`${log.id}-${index}-${log.timestamp}`}
                                log={log}
                                index={index}
                                getLogLevelColor={getLogLevelColor}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
