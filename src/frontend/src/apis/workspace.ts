import { request } from '../utils/request'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const WORKSPACE_SIMPLE_CHAT_STREAM_PATH = '/api/v1/workspace/simple/chat'

// 获取工作区插件列表
export const getWorkspacePluginsAPI = async () => {
  return request({
    url: '/api/v1/workspace/plugins',
    method: 'get'
  })
}

// 获取工作区会话列表
export const getWorkspaceSessionsAPI = async () => {
  return request({
    url: '/api/v1/workspace/session',
    method: 'get'
  })
}

// 创建工作区会话
export interface CreateWorkspaceSessionPayload {
  title?: string
  agent?: string
  session_id?: string
  contexts?: any[]
}

export const createWorkspaceSessionAPI = async (data: CreateWorkspaceSessionPayload) => {
  return request({
    url: '/api/v1/workspace/session',
    method: 'post',
    data
  })
}

// 获取工作区会话信息
export const getWorkspaceSessionInfoAPI = async (sessionId: string) => {
  return request({
    url: `/api/v1/workspace/session/${sessionId}`,
    method: 'post'
  })
}

// 删除工作区会话  
export const deleteWorkspaceSessionAPI = async (sessionId: string) => {
  return request({
    url: `/api/v1/workspace/session`,
    method: 'delete',
    params: {
      session_id: sessionId
    }
  })
}

// 工作区日常对话接口
export interface WorkSpaceSimpleTask {
  query: string
  model_id: string
  plugins: string[]
  mcp_servers: string[]
  session_id?: string  // 会话ID，使用uuid4().hex格式
}

export const workspaceSimpleChatAPI = async (data: WorkSpaceSimpleTask) => {
  return request({
    url: '/api/v1/workspace/simple/chat',
    method: 'post',
    data,
    responseType: 'stream'
  })
}

// 工作区日常对话（SSE 流式）
export const workspaceSimpleChatStreamAPI = async (
  data: WorkSpaceSimpleTask,
  onMessage: (chunk: string) => void,
  onError?: (err: any) => void,
  onClose?: () => void
) => {
  const token = localStorage.getItem('token')
  const ctrl = new AbortController()

  console.log('=== workspaceSimpleChatStreamAPI 调用 ===')
  console.log('请求参数:', data)
  console.log('请求 URL:', WORKSPACE_SIMPLE_CHAT_STREAM_PATH)

  try {
    await fetchEventSource(WORKSPACE_SIMPLE_CHAT_STREAM_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data),
      signal: ctrl.signal,
      openWhenHidden: true,
      onmessage(event) {
        console.log('📨 收到 SSE 原始消息:', event.data)
        if (!event.data) return

        let parsed: any
        try {
          parsed = JSON.parse(event.data)
        } catch (_) {
          console.warn('⚠️ JSON 解析失败，跳过:', event.data)
          return
        }

        console.log('📦 解析后的数据:', parsed)

        let content = ''

        // 兼容后端返回 {event:'task_result', data:{message}} 或 {data:{chunk}}
        if (parsed?.data?.message !== undefined) {
          if (parsed.data.message === '') {
            console.log('⏭️ 跳过空 message')
            return
          }
          content = parsed.data.message
          console.log('📝 提取 message:', content)
        } else if (parsed?.data?.chunk !== undefined) {
          if (parsed.data.chunk === '') {
            console.log('⏭️ 跳过空 chunk')
            return
          }
          content = parsed.data.chunk
          console.log('📝 提取 chunk:', content)
        } else {
          console.warn('⚠️ 未识别的数据格式，跳过')
          return
        }

        try {
          onMessage(content)
        } catch (error) {
          console.error('❌ 处理 SSE 消息回调失败:', error)
          onError?.(error)
          ctrl.abort()
        }
      },
      onerror(err) {
        console.error('❌ SSE 错误:', err)
        onError?.(err)
        ctrl.abort()
      },
      onclose() {
        console.log('✅ SSE 连接关闭')
        onClose?.()
      }
    })
  } catch (error: any) {
    console.error('❌ fetchEventSource 异常:', error)
    if (error?.name !== 'AbortError') {
      onError?.(error)
    }
  }
}
