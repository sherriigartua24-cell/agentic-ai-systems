import { getAccessToken } from './googleAuth'

export type PlannerEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  location?: string
}

export type PlannerTask = {
  id: string
  taskListId: string
  title: string
  completed: boolean
  due?: Date
  notes?: string
}

async function googleFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Google API error ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function listEvents(timeMin: Date, timeMax: Date): Promise<PlannerEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })
  const data = await googleFetch<{
    items: Array<{
      id: string
      summary?: string
      location?: string
      start: { dateTime?: string; date?: string }
      end: { dateTime?: string; date?: string }
    }>
  }>(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`)

  return (data.items ?? []).map((item) => {
    const allDay = Boolean(item.start.date && !item.start.dateTime)
    return {
      id: item.id,
      title: item.summary ?? '(untitled)',
      start: new Date(item.start.dateTime ?? item.start.date ?? ''),
      end: new Date(item.end.dateTime ?? item.end.date ?? ''),
      allDay,
      location: item.location,
    }
  })
}

async function getDefaultTaskListId(): Promise<string> {
  const data = await googleFetch<{ items: Array<{ id: string }> }>(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
  )
  const first = data.items?.[0]
  if (!first) throw new Error('No Google Tasks list found for this account.')
  return first.id
}

export async function listPriorityTasks(): Promise<PlannerTask[]> {
  const taskListId = await getDefaultTaskListId()
  const data = await googleFetch<{
    items: Array<{
      id: string
      title: string
      status: string
      due?: string
      notes?: string
    }>
  }>(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&maxResults=50`,
  )
  return (data.items ?? []).map((item) => ({
    id: item.id,
    taskListId,
    title: item.title,
    completed: item.status === 'completed',
    due: item.due ? new Date(item.due) : undefined,
    notes: item.notes,
  }))
}

export async function setTaskCompleted(
  taskListId: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  await googleFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: completed ? 'completed' : 'needsAction' }),
  })
}
