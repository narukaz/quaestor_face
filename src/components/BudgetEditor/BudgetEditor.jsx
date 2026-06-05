import { useState, useEffect } from 'react'
import { DollarSign, Pencil, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../../api/api'
import './BudgetEditor.css'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function BudgetEditor({ type = 'personal', label = 'Personal Budget', onBudgetUpdate }) {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const loadBudget = async () => {
    setLoading(true)
    try {
      const data = await api.getBudgets()
      const found = (data.budgets || []).find(b => b.type === type)
      setBudget(found || null)
    } catch {
      setBudget(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBudget() }, [type])

  const startEdit = () => {
    setInputVal(budget ? String(budget.limit) : '')
    setEditing(true)
    setFeedback(null)
  }

  const cancelEdit = () => {
    setEditing(false)
    setInputVal('')
    setFeedback(null)
  }

  const save = async () => {
    const val = parseFloat(inputVal)
    if (!val || val <= 0) {
      setFeedback({ type: 'error', msg: 'Enter a valid amount.' })
      return
    }
    setSaving(true)
    try {
      let data
      if (budget?._id && budget.editable) {
        data = await api.updateBudget(budget._id, { limit: val })
      } else {
        data = await api.setBudget({ limit: val, type })
      }
      setBudget(data.budget)
      setEditing(false)
      setFeedback({ type: 'success', msg: 'Budget saved!' })
      if (onBudgetUpdate) onBudgetUpdate()
      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      setFeedback({ type: 'error', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  // Is this budget editable (same month+year or no budget yet)
  const canEdit = !budget || (budget.month === currentMonth && budget.year === currentYear)
  const isLocked = budget && (budget.month !== currentMonth || budget.year !== currentYear)

  if (loading) return (
    <div className="budget-editor-loading">
      <Loader2 size={14} className="be-spin" /> Loading budget…
    </div>
  )

  return (
    <div className="budget-editor">
      <div className="be-header">
        <div className="be-label-row">
          <DollarSign size={14} className="be-icon" />
          <span className="be-label">{label}</span>
          {isLocked && <Lock size={12} className="be-lock-icon" title="Past month — locked" />}
        </div>
        <span className="be-month">
          {budget ? `${MONTH_NAMES[budget.month - 1]} ${budget.year}` : `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`}
        </span>
      </div>

      {feedback && (
        <div className={`be-feedback be-feedback-${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {feedback.msg}
        </div>
      )}

      {!editing ? (
        <div className="be-display">
          <div className="be-amount-row">
            <span className="be-amount">
              {budget ? `$${budget.limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : <span className="be-unset">Not set</span>}
            </span>
            {canEdit ? (
              <button className="be-edit-btn" onClick={startEdit} title="Edit budget">
                <Pencil size={13} />
                {budget ? 'Edit' : 'Set budget'}
              </button>
            ) : (
              <span className="be-locked-tag">
                <Lock size={11} /> Locked
              </span>
            )}
          </div>
          {isLocked && (
            <p className="be-locked-msg">
              This budget is from a past month and can no longer be changed.
              A new budget can be set for {MONTH_NAMES[currentMonth - 1]} {currentYear}.
            </p>
          )}
        </div>
      ) : (
        <div className="be-edit-form">
          <div className="be-input-wrap">
            <span className="be-currency">$</span>
            <input
              className="be-input"
              type="number"
              min="0"
              placeholder="0.00"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancelEdit() }}
              autoFocus
            />
          </div>
          <div className="be-edit-actions">
            <button className="be-cancel-btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button className="be-save-btn" onClick={save} disabled={saving || !inputVal}>
              {saving ? <Loader2 size={13} className="be-spin" /> : <CheckCircle2 size={13} />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
