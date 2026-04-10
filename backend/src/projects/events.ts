import { EventEmitter } from 'node:events'

export interface ProjectEvent {
  type: 'progress' | 'status' | 'error' | 'build-complete' | 'new-message'
  data: Record<string, unknown>
}

const emitter = new EventEmitter()
emitter.setMaxListeners(200)

export function emitProjectEvent(projectId: string, event: ProjectEvent): void {
  emitter.emit(`project:${projectId}`, event)
}

export function onProjectEvent(projectId: string, listener: (event: ProjectEvent) => void): () => void {
  const key = `project:${projectId}`
  emitter.on(key, listener)
  return () => emitter.off(key, listener)
}

// Admin-global events
export function emitAdminEvent(event: ProjectEvent & { projectId?: string }): void {
  emitter.emit('admin', event)
}

export function onAdminEvent(listener: (event: ProjectEvent & { projectId?: string }) => void): () => void {
  emitter.on('admin', listener)
  return () => emitter.off('admin', listener)
}
