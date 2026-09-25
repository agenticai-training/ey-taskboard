const API_BASE = 'http://127.0.0.1:8000'

export async function createTask(task) {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!res.ok) {
    throw new Error(`createTask failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

export async function createComment(taskId, comment) {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment),
  })
  if (!res.ok) {
    throw new Error(`createComment failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}
