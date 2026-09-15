import { MONTH_COLORS } from '../lib/monthColors'

type View = 'month' | 'week'

type Props = {
  monthLabel: string
  year: number
  selectedMonthIndex: number
  view: View
  onSelectMonth: (monthIndex: number) => void
  onChangeView: (view: View) => void
  onSignOut: () => void
}

const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export default function PlannerHeader({
  monthLabel,
  year,
  selectedMonthIndex,
  view,
  onSelectMonth,
  onChangeView,
  onSignOut,
}: Props) {
  return (
    <div className="planner-shell__chrome">
      <nav className="month-tabs" aria-label="Select month">
        {MONTH_ABBR.map((abbr, index) => (
          <button
            key={abbr}
            type="button"
            className={`month-tabs__tab${index === selectedMonthIndex ? ' month-tabs__tab--active' : ''}`}
            style={{ backgroundColor: MONTH_COLORS[index] }}
            onClick={() => onSelectMonth(index)}
          >
            {abbr}
          </button>
        ))}
      </nav>

      <header className="top-bar">
        <div className="top-bar__title">
          <span className="top-bar__month">{monthLabel}</span>
          <span className="top-bar__year">{year}</span>
        </div>
        <div className="top-bar__controls">
          <div className="view-toggle" role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'month'}
              className={view === 'month' ? 'active' : ''}
              onClick={() => onChangeView('month')}
            >
              Month
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'week'}
              className={view === 'week' ? 'active' : ''}
              onClick={() => onChangeView('week')}
            >
              Week
            </button>
          </div>
          <button type="button" className="sign-out" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
    </div>
  )
}
