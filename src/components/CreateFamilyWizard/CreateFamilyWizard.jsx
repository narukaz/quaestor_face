import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, ChevronRight, ChevronLeft, Users, DollarSign, Mail,
  CheckCircle2, XCircle, Loader2, Plus, Trash2, TrendingUp
} from 'lucide-react'
import { api } from '../../api/api'
import './CreateFamilyWizard.css'

const STEPS = [
  { id: 'name',    icon: Users,        title: 'Name your family',     sub: 'Give your family group an identity' },
  { id: 'budget',  icon: DollarSign,   title: 'Set monthly budget',   sub: 'How much does your family plan to spend?' },
  { id: 'members', icon: Mail,         title: 'Invite members',       sub: "Add people by email — they'll get an invitation" },
]

export default function CreateFamilyWizard({ onComplete, onDismiss }) {
  const [step, setStep] = useState(0)
  const [slideDir, setSlideDir] = useState('forward') // 'forward' | 'back'

  // Step 0 — Name
  const [familyName, setFamilyName] = useState('')

  // Step 1 — Budget
  const [budgetAmount, setBudgetAmount] = useState('')

  // Step 2 — Members
  const [emailInput, setEmailInput] = useState('')
  const [emailStatus, setEmailStatus] = useState(null) // null | 'checking' | {exists, inFamily, name, message, isSelf}
  const [members, setMembers] = useState([]) // [{email, name}]
  const debounceRef = useRef(null)

  // Step completion state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const goNext = () => {
    setError('')
    setSlideDir('forward')
    setStep(s => s + 1)
  }
  const goBack = () => {
    setError('')
    setSlideDir('back')
    setStep(s => s - 1)
  }

  // Real-time email check with debounce
  useEffect(() => {
    const email = emailInput.trim()
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailStatus(null)
      return
    }
    // Don't check duplicates already added
    if (members.find(m => m.email === email)) {
      setEmailStatus({ duplicate: true, message: 'Already added to the list.' })
      return
    }
    setEmailStatus('checking')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.checkUser(email)
        setEmailStatus(data)
      } catch {
        setEmailStatus({ exists: false, message: 'Could not verify email.' })
      }
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [emailInput, members])

  const handleAddMember = () => {
    if (!emailStatus || emailStatus === 'checking') return
    if (!emailStatus.exists || emailStatus.inFamily || emailStatus.isSelf || emailStatus.duplicate) return
    setMembers(prev => [...prev, { email: emailInput.trim(), name: emailStatus.name }])
    setEmailInput('')
    setEmailStatus(null)
  }

  const handleRemoveMember = (email) => {
    setMembers(prev => prev.filter(m => m.email !== email))
  }

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Create family
      const famData = await api.createFamily(familyName.trim())
      const familyId = famData.family._id

      // 2. Set budget if provided
      if (budgetAmount && parseFloat(budgetAmount) > 0) {
        await api.setBudget({ limit: parseFloat(budgetAmount), type: 'shared' })
      }

      // 3. Send invites
      for (const m of members) {
        try { await api.inviteToFamily(m.email) } catch { /* silently skip failed invites */ }
      }

      onComplete(famData.family)
    } catch (err) {
      setError(err.message || 'Failed to create family. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canNext0 = familyName.trim().length >= 2
  const canNext1 = true // budget is optional, can skip
  const isLastStep = step === 2

  const emailOk = emailStatus && emailStatus !== 'checking' && emailStatus.exists && !emailStatus.inFamily && !emailStatus.isSelf && !emailStatus.duplicate

  return (
    <div className="wizard-overlay" onClick={e => e.target === e.currentTarget && onDismiss()}>
      <div className="wizard-card">

        {/* Ambient blobs inside the card */}
        <div className="wizard-blob wizard-blob-a" />
        <div className="wizard-blob wizard-blob-b" />

        {/* Dismiss */}
        <button className="wizard-dismiss" onClick={onDismiss} aria-label="Close">
          <X size={16} />
        </button>

        {/* Brand */}
        <div className="wizard-brand">
          <div className="wizard-brand-icon"><TrendingUp size={14} /></div>
          <span>Quaestor</span>
        </div>

        {/* Step indicator */}
        <div className="wizard-steps-indicator">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`wsi-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="wsi-dot">
                {i < step ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
              </div>
              {i < STEPS.length - 1 && <div className="wsi-line" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className={`wizard-body wizard-slide-${slideDir} wizard-slide-key-${step}`}>
          {/* Heading */}
          <div className="wizard-step-head">
            <div className="wizard-step-icon-wrap">
              {(() => { const Icon = STEPS[step].icon; return <Icon size={20} /> })()}
            </div>
            <div>
              <h2 className="wizard-step-title">{STEPS[step].title}</h2>
              <p className="wizard-step-sub">{STEPS[step].sub}</p>
            </div>
          </div>

          {error && <div className="wizard-error">{error}</div>}

          {/* ── Step 0: Family name ── */}
          {step === 0 && (
            <div className="wizard-fields">
              <div className="wizard-field">
                <label className="wizard-label">Family name</label>
                <input
                  className="wizard-input"
                  type="text"
                  placeholder='e.g. "The Singhs" or "Smith Household"'
                  value={familyName}
                  onChange={e => setFamilyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext0 && goNext()}
                  autoFocus
                />
                <span className="wizard-hint">Min. 2 characters</span>
              </div>
            </div>
          )}

          {/* ── Step 1: Budget ── */}
          {step === 1 && (
            <div className="wizard-fields">
              <div className="wizard-field">
                <label className="wizard-label">Monthly family budget</label>
                <div className="wizard-amount-wrap">
                  <span className="wizard-currency">$</span>
                  <input
                    className="wizard-input wizard-amount-input"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={budgetAmount}
                    onChange={e => setBudgetAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && goNext()}
                    autoFocus
                  />
                </div>
                <span className="wizard-hint">
                  You can change this later — but only within the same month.
                </span>
              </div>
              <div className="wizard-month-tag">
                Budget for: <strong>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong>
              </div>
            </div>
          )}

          {/* ── Step 2: Members ── */}
          {step === 2 && (
            <div className="wizard-fields">
              <div className="wizard-field">
                <label className="wizard-label">Add by email</label>
                <div className="wizard-email-row">
                  <div className="wizard-email-input-wrap">
                    <input
                      className="wizard-input wizard-email-input"
                      type="email"
                      placeholder="friend@example.com"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && emailOk && handleAddMember()}
                      autoFocus
                    />
                    {/* Real-time status indicator */}
                    {emailInput.includes('@') && (
                      <div className="wizard-email-status">
                        {emailStatus === 'checking' ? (
                          <Loader2 size={15} className="email-checking-spin" />
                        ) : emailStatus?.duplicate ? (
                          <span className="est-warn">Already added</span>
                        ) : emailStatus?.isSelf ? (
                          <span className="est-warn">That's you!</span>
                        ) : emailStatus?.inFamily ? (
                          <span className="est-error"><XCircle size={13} /> {emailStatus.message}</span>
                        ) : emailStatus?.exists === false ? (
                          <span className="est-error"><XCircle size={13} /> Not found</span>
                        ) : emailStatus?.exists ? (
                          <span className="est-ok"><CheckCircle2 size={13} /> {emailStatus.name}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <button
                    className="wizard-add-btn"
                    onClick={handleAddMember}
                    disabled={!emailOk}
                    type="button"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Members list */}
              {members.length > 0 && (
                <div className="wizard-members-list">
                  {members.map(m => (
                    <div key={m.email} className="wizard-member-chip">
                      <div className="wmc-avatar">{m.name[0].toUpperCase()}</div>
                      <div className="wmc-info">
                        <span className="wmc-name">{m.name}</span>
                        <span className="wmc-email">{m.email}</span>
                      </div>
                      <button className="wmc-remove" onClick={() => handleRemoveMember(m.email)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {members.length === 0 && (
                <p className="wizard-skip-note">
                  You can also skip this and invite members later from your profile.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="wizard-actions">
          {step > 0 ? (
            <button className="wizard-btn wizard-btn-back" onClick={goBack} disabled={loading}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <button className="wizard-btn wizard-btn-ghost" onClick={onDismiss}>
              Skip for now
            </button>
          )}

          {!isLastStep ? (
            <button
              className="wizard-btn wizard-btn-next"
              onClick={goNext}
              disabled={step === 0 && !canNext0}
            >
              {step === 1 && !budgetAmount ? 'Skip' : 'Continue'} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="wizard-btn wizard-btn-create"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? <Loader2 size={15} className="email-checking-spin" /> : <CheckCircle2 size={15} />}
              {loading ? 'Creating…' : 'Create Family'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
