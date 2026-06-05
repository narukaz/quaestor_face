import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { api } from '../../api/api'
import './SpendCard.css'

export default function SpendCard({ budgetType, setBudgetType, refreshTrigger }) {
  const now = new Date()
  const CURRENT_YEAR = now.getFullYear()
  const CURRENT_MONTH_INDEX = now.getMonth()
  const CURRENT_DAY = now.getDate()

  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(CURRENT_MONTH_INDEX)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)

  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(CURRENT_DAY)

  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [dialogueIndex, setDialogueIndex] = useState(0)

  // Real budget & spending data
  const [budget, setBudget] = useState(null)      // current month's budget limit
  const [totalSpent, setTotalSpent] = useState(null) // sum of expenses this month

  const dialogues = [
    `"It's an expense manager, not a time machine. I mean, you can go back, but not forward."`,
    `"Who knows which bank you're going to rob once you cross your budget?"`
  ]

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const isFutureMonth = useCallback(() =>
    selectedYear > CURRENT_YEAR ||
    (selectedYear === CURRENT_YEAR && selectedMonthIndex > CURRENT_MONTH_INDEX)
  , [selectedYear, selectedMonthIndex, CURRENT_YEAR, CURRENT_MONTH_INDEX])

  const isCurrentMonth = useCallback(() =>
    selectedYear === CURRENT_YEAR && selectedMonthIndex === CURRENT_MONTH_INDEX
  , [selectedYear, selectedMonthIndex, CURRENT_YEAR, CURRENT_MONTH_INDEX])

  // Fetch budget + expenses for this budgetType
  const loadData = useCallback(async () => {
    try {
      // Budget
      const budgetData = await api.getBudgets()
      const budgetType_ = budgetType === 'Family' ? 'shared' : 'personal'
      const found = (budgetData.budgets || []).find(b => b.type === budgetType_)
      setBudget(found || null)

      // Total spent this month
      const expType = budgetType === 'Family' ? 'shared' : 'personal'
      const expData = await api.getExpenses(expType)
      const monthStart = new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX, 1)
      const monthEnd   = new Date(CURRENT_YEAR, CURRENT_MONTH_INDEX + 1, 0)
      const sum = (expData.expenses || [])
        .filter(e => {
          const d = new Date(e.date)
          return d >= monthStart && d <= monthEnd
        })
        .reduce((acc, e) => acc + Math.abs(e.amount), 0)
      setTotalSpent(sum)
    } catch {
      setBudget(null)
      setTotalSpent(null)
    }
  }, [budgetType, CURRENT_YEAR, CURRENT_MONTH_INDEX])

  useEffect(() => { loadData() }, [loadData, refreshTrigger])

  const getBarData = () => {
    const baseData = [35, 45, 25, 60, 75, 50, 40, 65, 80, 55, 30, 45]
    if (budgetType === 'Family') return baseData.map(v => Math.min(100, Math.round(v * 1.25)))
    return baseData
  }

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month, year) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  const daysInMonth = getDaysInMonth(selectedMonthIndex, selectedYear)
  const firstDayIndex = getFirstDayOfMonth(selectedMonthIndex, selectedYear)
  const calendarCells = []
  for (let i = 0; i < firstDayIndex; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

  // Spend value: use real data for current month, mock math for past months
  const getSpendValue = () => {
    if (isFutureMonth()) return '$0.00'
    if (isCurrentMonth()) {
      const val = totalSpent || 0
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    // Past month fallback mock
    if (rangeStart === null) return '$0.00'
    const multiplier = budgetType === 'Family' ? 2.45 : 1.0
    if (rangeEnd !== null) {
      const length = rangeEnd - rangeStart + 1
      const base = 750 + (selectedMonthIndex * 35) + (selectedYear % 10 * 15)
      const val = (base + length * 90) * multiplier
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    const base = 750 + (selectedMonthIndex * 35) + (selectedYear % 10 * 15)
    const val = (base + rangeStart * 15) * multiplier
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Budget limit display
  const getBudgetLine = () => {
    if (!isCurrentMonth()) return null
    if (!budget) return null
    const pct = budget.limit > 0 && totalSpent !== null
      ? Math.min(100, Math.round((totalSpent / budget.limit) * 100))
      : 0
    const over = totalSpent > budget.limit
    return { limit: budget.limit, pct, over }
  }

  const budgetLine = getBudgetLine()

  const handleDayClick = (day) => {
    if (!day) return
    if (isCurrentMonth() && day > CURRENT_DAY) return
    if (rangeStart !== null && rangeEnd === null) {
      if (day < rangeStart) { setRangeEnd(rangeStart); setRangeStart(day) }
      else setRangeEnd(day)
    } else {
      setRangeStart(day); setRangeEnd(null)
    }
  }

  const handlePrev = () => {
    let m = selectedMonthIndex, y = selectedYear
    if (m === 0) { m = 11; y-- } else m--
    setSelectedMonthIndex(m); setSelectedYear(y)
    const isFuture = y > CURRENT_YEAR || (y === CURRENT_YEAR && m > CURRENT_MONTH_INDEX)
    if (isFuture) { setRangeStart(null); setRangeEnd(null); setDialogueIndex(p => 1 - p) }
    else { setRangeStart(1); setRangeEnd(getDaysInMonth(m, y)) }
  }

  const handleNext = () => {
    let m = selectedMonthIndex, y = selectedYear
    if (m === 11) { m = 0; y++ } else m++
    setSelectedMonthIndex(m); setSelectedYear(y)
    const isFuture = y > CURRENT_YEAR || (y === CURRENT_YEAR && m > CURRENT_MONTH_INDEX)
    if (isFuture) { setRangeStart(null); setRangeEnd(null); setDialogueIndex(p => 1 - p) }
    else if (y === CURRENT_YEAR && m === CURRENT_MONTH_INDEX) { setRangeStart(1); setRangeEnd(CURRENT_DAY) }
    else { setRangeStart(1); setRangeEnd(getDaysInMonth(m, y)) }
  }

  return (
    <div className="spend-card clickable" onClick={() => setShowCalendar(!showCalendar)}>

      <div className="card-controls" onClick={e => e.stopPropagation()}>
        <button className={`control-btn ${showCalendar ? 'active' : ''}`} onClick={() => setShowCalendar(!showCalendar)} title="Toggle Calendar">
          <Calendar size={16} />
        </button>
      </div>

      <div className="card-label-container">
        <span className="month-label">{months[selectedMonthIndex]}</span>
        <span className={`budget-type-badge ${showTypeSelector ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); setShowTypeSelector(!showTypeSelector) }}
          title="Change budget type"
        >
          {budgetType}<span className="dropdown-arrow">▼</span>
        </span>
        <span className="budget-label">budget</span>
      </div>

      <div className={`budget-type-selector-wrapper ${showTypeSelector ? 'expanded' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="budget-type-selector-inner">
          <span className="selector-instruction">Select Account:</span>
          <div className="selector-options">
            {['Personal', 'Family'].map(t => (
              <button key={t} className={`selector-opt-btn ${budgetType === t ? 'selected' : ''}`}
                onClick={e => { e.stopPropagation(); setBudgetType(t); setShowTypeSelector(false) }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spend value */}
      <div className="value-container">
        <h2 className="spend-value">{getSpendValue()}</h2>
      </div>

      {/* Budget progress bar — only for current month when budget is set */}
      {isCurrentMonth() && budgetLine && (
        <div className="budget-progress-wrap" onClick={e => e.stopPropagation()}>
          <div className="budget-progress-row">
            <span className="budget-progress-label">
              {budgetLine.over ? '⚠️ Over budget' : `${budgetLine.pct}% of budget used`}
            </span>
            <span className={`budget-progress-limit ${budgetLine.over ? 'over' : ''}`}>
              ${budgetLine.limit.toLocaleString('en-US', { minimumFractionDigits: 0 })} limit
            </span>
          </div>
          <div className="budget-progress-track">
            <div
              className={`budget-progress-fill ${budgetLine.over ? 'budget-over' : budgetLine.pct > 75 ? 'budget-warn' : 'budget-ok'}`}
              style={{ width: `${Math.min(100, budgetLine.pct)}%` }}
            />
          </div>
        </div>
      )}

      {isCurrentMonth() && !budgetLine && (
        <div className="budget-not-set-hint" onClick={e => e.stopPropagation()}>
          No budget set for this month — add one in the Budget card below.
        </div>
      )}

      <div className="card-bar-graph" onClick={e => e.stopPropagation()}>
        {getBarData().map((val, idx) => {
          const barStartDay = Math.floor(idx * 2.5) + 1
          const barEndDay = Math.floor((idx + 1) * 2.5)
          const isActive = rangeStart && rangeEnd && !(barEndDay < rangeStart || barStartDay > rangeEnd)
          return (
            <div key={idx} className="bar-wrapper">
              <div className={`bar-fill ${isActive ? 'active' : ''}`} style={{ height: `${val}%` }} />
            </div>
          )
        })}
      </div>

      <div className={`calendar-dropdown-section ${showCalendar ? 'expanded' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="nav-arrow-btn" onClick={handlePrev} aria-label="Previous Month"><ChevronLeft size={16} /></button>
          <span className="calendar-month-title">{months[selectedMonthIndex]} {selectedYear}</span>
          <button className="nav-arrow-btn" onClick={handleNext} aria-label="Next Month"><ChevronRight size={16} /></button>
        </div>

        {isFutureMonth() ? (
          <div className="time-machine-container">
            <p className="time-machine-message">{dialogues[dialogueIndex]}</p>
          </div>
        ) : (
          <div className="calendar-grid">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className={`weekday-header ${i >= 5 ? 'text-weekend' : ''}`}>{d}</div>
            ))}
            {calendarCells.map((day, index) => {
              if (day === null) return <div key={index} className="day-cell-wrapper"><span className="day-empty-cell" /></div>
              const isStart = day === rangeStart
              const isEnd = day === rangeEnd
              const isMid = rangeStart && rangeEnd && day > rangeStart && day < rangeEnd
              const isFutureDay = isCurrentMonth() && day > CURRENT_DAY
              const isWeekend = index % 7 === 5 || index % 7 === 6
              let wrapperClass = 'day-cell-wrapper'
              let btnClass = 'day-cell-btn'
              if (isStart && rangeEnd) { wrapperClass += ' range-start-wrapper'; btnClass += ' selected-button' }
              else if (isStart && !rangeEnd) { btnClass += ' selected-button' }
              else if (isEnd) { wrapperClass += ' range-end-wrapper'; btnClass += ' selected-button' }
              else if (isMid) { wrapperClass += ' range-mid-wrapper' }
              if (isFutureDay) btnClass += ' disabled'
              if (isWeekend) btnClass += ' weekend'
              const isMonday = index % 7 === 0, isSunday = index % 7 === 6
              if (isMid) { if (isMonday) wrapperClass += ' round-left'; if (isSunday) wrapperClass += ' round-right' }
              return (
                <div key={index} className={wrapperClass}>
                  <button className={btnClass} onClick={() => handleDayClick(day)} disabled={isFutureDay}>{day}</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
