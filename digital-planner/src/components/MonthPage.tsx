import type { PlannerEvent, PlannerTask } from '../lib/calendar'
import { format } from 'date-fns'
import InkCanvas from './InkCanvas'

type Props = {
  monthLabel: string
  monthKey: string // e.g. "2026-09", used as the ink note id
  tasks: PlannerTask[]
  onToggleTask: (task: PlannerTask) => void
  importantEvents: PlannerEvent[]
  laterEvents: PlannerEvent[]
  loading: boolean
}

export default function MonthPage({
  monthLabel,
  monthKey,
  tasks,
  onToggleTask,
  importantEvents,
  laterEvents,
  loading,
}: Props) {
  return (
    <div className="paper-page month-page">
      <h2 className="paper-page__title">{monthLabel}</h2>

      <div className="month-page__grid">
        <section className="paper-box month-page__priorities">
          <h3>Priorities</h3>
          {loading && <p className="paper-box__empty">Loading your tasks…</p>}
          {!loading && tasks.length === 0 && (
            <p className="paper-box__empty">No tasks in Google Tasks yet.</p>
          )}
          <ul className="checklist">
            {tasks.map((task) => (
              <li key={task.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task)}
                  />
                  <span className={task.completed ? 'checklist__done' : ''}>{task.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <div className="month-page__side">
          <section className="paper-box">
            <h3>Important</h3>
            {importantEvents.length === 0 && !loading && (
              <p className="paper-box__empty">Nothing flagged this week.</p>
            )}
            <ul className="event-lines">
              {importantEvents.map((event) => (
                <li key={event.id}>
                  <span className="event-lines__date">{format(event.start, 'EEE d')}</span>
                  <span>{event.title}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="paper-box">
            <h3>Looking ahead</h3>
            {laterEvents.length === 0 && !loading && (
              <p className="paper-box__empty">Nothing later this month yet.</p>
            )}
            <ul className="event-lines">
              {laterEvents.map((event) => (
                <li key={event.id}>
                  <span className="event-lines__date">{format(event.start, 'MMM d')}</span>
                  <span>{event.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="paper-box month-page__notes">
          <h3>Notes</h3>
          <InkCanvas noteId={`month:${monthKey}`} height={200} />
        </section>
      </div>
    </div>
  )
}
