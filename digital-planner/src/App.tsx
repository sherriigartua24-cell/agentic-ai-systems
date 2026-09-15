import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import './styles/paper.css'
import SignIn from './components/SignIn'
import PlannerHeader from './components/PlannerHeader'
import MonthPage from './components/MonthPage'
import WeekPage from './components/WeekPage'
import NotePanel from './components/NotePanel'
import { getAccessToken, isSignedIn, requestAccessToken, signOut } from './lib/googleAuth'
import { listEvents, listPriorityTasks, setTaskCompleted } from './lib/calendar'
import type { PlannerEvent, PlannerTask } from './lib/calendar'

type View = 'month' | 'week'

type OpenNote = { id: string; title: string; subtitle?: string }

const TODAY = new Date()

function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export default function App() {
  const [signedIn, setSignedIn] = useState(() => isSignedIn())
  const [authPending, setAuthPending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [view, setView] = useState<View>('week')
  const [anchorDate, setAnchorDate] = useState(TODAY)

  const [events, setEvents] = useState<PlannerEvent[]>([])
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [openNote, setOpenNote] = useState<OpenNote | null>(null)

  const monthStart = useMemo(() => startOfMonth(anchorDate), [anchorDate])
  const monthEnd = useMemo(() => endOfMonth(anchorDate), [anchorDate])
  const weekStart = useMemo(() => startOfWeek(anchorDate, { weekStartsOn: 1 }), [anchorDate])
  const weekEnd = useMemo(() => endOfWeek(anchorDate, { weekStartsOn: 1 }), [anchorDate])
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const handleSignIn = useCallback(async () => {
    setAuthPending(true)
    setAuthError(null)
    try {
      await requestAccessToken()
      setSignedIn(true)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to sign in.')
    } finally {
      setAuthPending(false)
    }
  }, [])

  const handleSignOut = useCallback(() => {
    signOut()
    setSignedIn(false)
    setEvents([])
    setTasks([])
  }, [])

  // Load a window a little wider than the visible calendar grid (the month
  // grid can spill into neighboring weeks) so both views always have data.
  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const rangeEnd = endOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 })

    Promise.all([listEvents(rangeStart, rangeEnd), listPriorityTasks()])
      .then(([fetchedEvents, fetchedTasks]) => {
        if (cancelled) return
        setEvents(fetchedEvents)
        setTasks(fetchedTasks)
      })
      .catch(async (err) => {
        if (cancelled) return
        // Access token may have simply expired; try one interactive retry.
        try {
          await getAccessToken()
          setLoadError('Session refreshed — try again in a moment.')
        } catch {
          setLoadError(err instanceof Error ? err.message : 'Failed to load your calendar.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [signedIn, monthStart, monthEnd])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, PlannerEvent[]>()
    for (const event of events) {
      const key = dayKey(event.start)
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
    return map
  }, [events])

  const importantEvents = useMemo(
    () => events.filter((e) => isWithinInterval(e.start, { start: weekStart, end: weekEnd })).slice(0, 8),
    [events, weekStart, weekEnd],
  )
  const laterEvents = useMemo(
    () => events.filter((e) => e.start > weekEnd && e.start <= monthEnd).slice(0, 8),
    [events, weekEnd, monthEnd],
  )

  const handleToggleTask = useCallback((task: PlannerTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
    )
    setTaskCompleted(task.taskListId, task.id, !task.completed).catch(() => {
      // Revert on failure.
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)),
      )
    })
  }, [])

  const handleOpenDay = useCallback((date: Date) => {
    setOpenNote({
      id: `day:${dayKey(date)}`,
      title: format(date, 'EEEE, MMMM d'),
      subtitle: 'Meeting & handwritten notes',
    })
  }, [])

  if (!signedIn) {
    return <SignIn onSignIn={handleSignIn} error={authError} pending={authPending} />
  }

  return (
    <div className="planner-shell">
      <PlannerHeader
        monthLabel={format(anchorDate, 'MMMM').toLowerCase()}
        year={anchorDate.getFullYear()}
        selectedMonthIndex={anchorDate.getMonth()}
        view={view}
        onSelectMonth={(monthIndex) =>
          setAnchorDate(new Date(anchorDate.getFullYear(), monthIndex, 1))
        }
        onChangeView={setView}
        onSignOut={handleSignOut}
      />

      <div className="planner-shell__nav">
        <button type="button" onClick={() => setAnchorDate(addMonths(anchorDate, -1))}>
          ‹ Prev
        </button>
        <button type="button" onClick={() => setAnchorDate(TODAY)}>
          Today
        </button>
        <button type="button" onClick={() => setAnchorDate(addMonths(anchorDate, 1))}>
          Next ›
        </button>
      </div>

      {loadError && <p className="planner-shell__error">{loadError}</p>}

      <main className="planner-shell__spread">
        {view === 'month' ? (
          <MonthPage
            monthLabel={format(anchorDate, 'MMMM').toLowerCase()}
            monthKey={format(anchorDate, 'yyyy-MM')}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            importantEvents={importantEvents}
            laterEvents={laterEvents}
            loading={loading}
          />
        ) : (
          <WeekPage
            weekDates={weekDates}
            eventsByDay={eventsByDay}
            weekKey={format(weekStart, "yyyy-'W'II")}
            onOpenDay={handleOpenDay}
          />
        )}
      </main>

      {openNote && (
        <NotePanel
          noteId={openNote.id}
          title={openNote.title}
          subtitle={openNote.subtitle}
          onClose={() => setOpenNote(null)}
        />
      )}
    </div>
  )
}
