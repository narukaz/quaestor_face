import { useState, useEffect } from 'react'
import { Users, UserPlus, Crown, X, Send, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { api } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import BudgetEditor from '../BudgetEditor/BudgetEditor'
import './FamilyPanel.css'

export default function FamilyPanel({ onFamilyUpdate, onCreateFamily }) {
  const { user, updateUser } = useAuth()
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inviteInput, setInviteInput] = useState('')
  const [feedback, setFeedback] = useState({ type: '', msg: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback({ type: '', msg: '' }), 4000)
  }

  const loadFamily = async () => {
    try {
      const data = await api.getFamily()
      setFamily(data.family)
    } catch {
      setFamily(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFamily() }, [])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteInput.trim()) return
    setActionLoading(true)
    try {
      const data = await api.inviteToFamily(inviteInput.trim())
      showFeedback('success', data.message)
      setInviteInput('')
      await loadFamily()
    } catch (err) {
      showFeedback('error', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the family?`)) return
    try {
      await api.removeFamilyMember(memberId)
      if (memberId === user.id) {
        updateUser({ familyId: null })
        setFamily(null)
      } else {
        await loadFamily()
      }
      showFeedback('success', `${memberName} removed.`)
    } catch (err) {
      showFeedback('error', err.message)
    }
  }

  if (loading) {
    return (
      <div className="family-panel">
        <div className="family-loading">
          <Loader2 className="spin-icon" size={22} />
          <span>Loading family…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="family-panel">
      <div className="family-panel-header">
        <Users size={18} className="family-header-icon" />
        <span>Family Group</span>
      </div>

      {/* Feedback banner */}
      {feedback.msg && (
        <div className={`family-feedback family-feedback-${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {feedback.msg}
        </div>
      )}

      {!family ? (
        /* ── No family: prompt to create ── */
        <div className="family-create-section">
          <div className="family-empty-illustration">
            <Users size={32} className="family-empty-icon" />
          </div>
          <p className="family-empty-text">
            You're not part of any family group yet.
          </p>
          <button className="family-btn family-btn-primary family-btn-wizard" onClick={onCreateFamily}>
            <Sparkles size={15} />
            Create Family Group
          </button>
          <p className="family-empty-sub">Set a budget, invite members, and track shared expenses together.</p>
        </div>
      ) : (
        /* ── Family details ── */
        <div className="family-details">
          <div className="family-name-row">
            <span className="family-name">{family.name}</span>
            <span className="family-member-count">{family.members?.length} member{family.members?.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Budget editor */}
          <div className="family-section">
            <h4 className="family-section-title">Monthly Budget</h4>
            <BudgetEditor type="shared" label="Family Budget" />
          </div>

          {/* Members list */}
          <div className="family-section">
            <h4 className="family-section-title">Members</h4>
            <div className="family-members-list">
              {family.members?.map(m => {
                const isCreator = family.createdBy?._id === m._id || family.createdBy === m._id
                const isSelf = m._id === user.id
                const canRemove = (isSelf && !isCreator) || (!isCreator && (family.createdBy?._id === user.id || family.createdBy === user.id))
                return (
                  <div key={m._id} className="family-member-row">
                    <div className="family-member-avatar">
                      {(m.name || m.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="family-member-info">
                      <span className="family-member-name">
                        {m.name || m.username}
                        {isSelf && <span className="family-badge family-badge-you">You</span>}
                        {isCreator && <span className="family-badge family-badge-creator">Admin</span>}
                      </span>
                      <span className="family-member-email">{m.email}</span>
                    </div>
                    {canRemove && (
                      <button
                        className="family-remove-btn"
                        onClick={() => handleRemoveMember(m._id, m.name || m.username)}
                        title="Remove member"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pending invites */}
          {family.pendingInvites?.filter(i => i.status === 'pending').length > 0 && (
            <div className="family-section">
              <h4 className="family-section-title">Pending Invites</h4>
              <div className="family-pending-list">
                {family.pendingInvites.filter(i => i.status === 'pending').map(inv => (
                  <div key={inv._id} className="family-pending-row">
                    <div className="family-member-avatar family-avatar-pending">
                      {(inv.userId?.name || inv.userId?.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="family-member-info">
                      <span className="family-member-name">{inv.userId?.name || inv.userId?.username}</span>
                      <span className="family-member-email">{inv.userId?.email}</span>
                    </div>
                    <span className="family-badge family-badge-pending">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite more */}
          <div className="family-section">
            <h4 className="family-section-title">Invite Someone</h4>
            <form className="family-form" onSubmit={handleInvite}>
              <input
                className="family-input"
                type="text"
                placeholder="Username or email"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                disabled={actionLoading}
              />
              <button className="family-btn family-btn-invite" type="submit" disabled={actionLoading || !inviteInput.trim()}>
                {actionLoading ? <Loader2 size={15} className="spin-icon" /> : <Send size={15} />}
                Send Invite
              </button>
            </form>
          </div>

          {/* Leave family */}
          {family.createdBy?._id !== user.id && family.createdBy !== user.id && (
            <button className="family-btn family-btn-leave" onClick={() => handleRemoveMember(user.id, 'you')}>
              Leave Family
            </button>
          )}
        </div>
      )}
    </div>
  )
}
