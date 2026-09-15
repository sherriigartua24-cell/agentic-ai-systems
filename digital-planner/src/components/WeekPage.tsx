import { format } from 'date-fns'
import type { PlannerEvent } from '../lib/calendar'
import InkCanvas from './InkCanvas'

type Props = {
  weekDates: Date[] // Monday..Sunday
  eventsByDay: Map<string, PlannerEvent[]>
  weekKey: string // e.g. "2026-W39", used as the extra notes box id
  onOpenDay: (date: Date) => void
}

function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function DayBox({
  date,
  events,
  onOpenDay,
}: {
  date: Date
  events: PlannerEvent[]
  onOpenDay: (date: Date) => void
}) {
  return (
    <button type="button" className="day-box" onClick={() => onOpenDay(date)}>
      <div className="day-box__header">
        <span className="day-box__number">{format(date, 'd')}</span>
        <span className="day-box__name">{format(date, 'EEEE')}</span>
      </div>
      <ul className="day-box__events">
        {events.map((event) => (
          <li key={event.id}>
            {!event.allDay && <span className="day-box__time">{format(event.start, 'h:mma')}</span>}
            <span>{event.title}</span>
          </li>
        ))}
      </ul>
      <div className="day-box__lines" aria-hidden="true" />
    </button>
  )
}

export default function WeekPage({ weekDates, eventsByDay, weekKey, onOpenDay }: Props) {
  const [mon, tue, wed, thu, fri, sat, sun] = weekDates

  return (
    <div className="paper-page week-page">
      <div className="week-page__year">{format(mon, 'yyyy')}</div>

      <div className="week-page__grid">
        <section className="paper-box week-page__notes">
          <h3>Week notes</h3>
          <InkCanvas noteId={`week:${weekKey}`} height={140} />
        </section>
        <DayBox date={mon} events={eventsByDay.get(dayKey(mon)) ?? []} onOpenDay={onOpenDay} />

        <DayBox date={tue} events={eventsByDay.get(dayKey(tue)) ?? []} onOpenDay={onOpenDay} />
        <DayBox date={wed} events={eventsByDay.get(dayKey(wed)) ?? []} onOpenDay={onOpenDay} />

        <DayBox date={thu} events={eventsByDay.get(dayKey(thu)) ?? []} onOpenDay={onOpenDay} />
        <DayBox date={fri} events={eventsByDay.get(dayKey(fri)) ?? []} onOpenDay={onOpenDay} />

        <DayBox date={sat} events={eventsByDay.get(dayKey(sat)) ?? []} onOpenDay={onOpenDay} />
        <DayBox date={sun} events={eventsByDay.get(dayKey(sun)) ?? []} onOpenDay={onOpenDay} />
      </div>
    </div>
  )
}
