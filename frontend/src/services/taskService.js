import api from './api'

// Thin wrapper over the /api/tasks endpoints. Keeping HTTP details in one
// module means components never import axios directly — which also makes them
// trivial to test with a mocked service.

/** Mirror server normalization: trim; inactive if < 3; truncate to 200. */
export function normalizeSearchQuery(q) {
  if (q == null) return null
  const trimmed = String(q).trim()
  if (trimmed.length < 3) return null
  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed
}

export async function listTasks(status, q) {
  const params = {}
  if (status && status !== 'all') params.status = status
  const effective = normalizeSearchQuery(q)
  if (effective) params.q = effective
  const { data } = await api.get('/api/tasks', { params })
  return data
}

export async function getTask(id) {
  const { data } = await api.get(`/api/tasks/${id}`)
  return data
}

export async function createTask(task) {
  const { data } = await api.post('/api/tasks', task)
  return data
}

export async function updateTask(id, task) {
  const { data } = await api.put(`/api/tasks/${id}`, task)
  return data
}

export async function deleteTask(id) {
  await api.delete(`/api/tasks/${id}`)
}

export async function listComments(taskId) {
  const { data } = await api.get(`/api/tasks/${taskId}/comments`)
  return data
}

export async function createComment(taskId, comment) {
  const { data } = await api.post(`/api/tasks/${taskId}/comments`, comment)
  return data
}

export async function deleteComment(taskId, commentId) {
  await api.delete(`/api/tasks/${taskId}/comments/${commentId}`)
}
