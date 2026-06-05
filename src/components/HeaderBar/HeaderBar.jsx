import { useState, useEffect, useRef } from 'react'
import { Bell, BellDot, LogOut, X, Users, CheckCircle, XCircle, Trash2, Check } from 'lucide-react'
import { api } from '../../api/api'
import FamilyPanel from '../FamilyPanel/FamilyPanel'
import './HeaderBar.css'

export default function HeaderBar({
  user = { name: 'Guest', email: '' },
  onLogout = () => {},
  onFamilyUpdate,
  onCreateFamily,
  onBudgetUpdate
}) {
  const [activeDrawer, setActiveDrawer] = useState(null) // 'profile' | 'notifications' | null
  const [notifications, setNotifications] = useState([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({}) // { [id]: true }
  const drawerRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const loadNotifications = async () => {
    setNotifsLoading(true)
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
    } catch {
      /* silently fail */
    } finally {
      setNotifsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Poll every 30s for new notifications
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const openDrawer = (panel) => {
    if (activeDrawer === panel) {
      setActiveDrawer(null)
    } else {
      setActiveDrawer(panel)
      if (panel === 'notifications') {
        loadNotifications()
      }
    }
  }

  const closeDrawer = () => setActiveDrawer(null)

  const handleDismiss = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }))
    try {
      await api.dismissNotification(id)
      setNotifications(prev => prev.filter(n => n._id !== id))
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* */ }
  }

  const handleAcceptInvite = async (notif) => {
    const inviteId = notif.inviteData?.inviteId
    if (!inviteId) return
    setActionLoading(prev => ({ ...prev, [notif._id]: 'accept' }))
    try {
      await api.acceptInvite(inviteId)
      setNotifications(prev => prev.filter(n => n._id !== notif._id))
      onFamilyUpdate && onFamilyUpdate()
      loadNotifications()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [notif._id]: false }))
    }
  }

  const handleRejectInvite = async (notif) => {
    const inviteId = notif.inviteData?.inviteId
    if (!inviteId) return
    setActionLoading(prev => ({ ...prev, [notif._id]: 'reject' }))
    try {
      await api.rejectInvite(inviteId)
      setNotifications(prev => prev.filter(n => n._id !== notif._id))
      loadNotifications()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [notif._id]: false }))
    }
  }

  // Notification type styles
  const notifMeta = {
    family_invite: { label: 'Family Invite', colorClass: 'notif-purple' },
    family_accepted: { label: 'Joined Family', colorClass: 'notif-green' },
    family_rejected: { label: 'Invite Declined', colorClass: 'notif-orange' },
    expense: { label: 'Expense', colorClass: 'notif-blue' },
    general: { label: 'Notice', colorClass: 'notif-gray' }
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="sidebar-system">
      {/* Fixed left icon bar */}
      <div className="sidebar-icon-bar">
        {/* Avatar / Profile */}
        <button
          id="profile-drawer-btn"
          className={`sidebar-icon-btn ${activeDrawer === 'profile' ? 'sidebar-btn-active' : ''}`}
          onClick={() => openDrawer('profile')}
          aria-label="Profile"
          title="Profile & Family"
        >
          <div className="sidebar-avatar">{getInitials(user.name)}</div>
        </button>

        {/* Bell / Notifications */}
        <button
          id="notifications-drawer-btn"
          className={`sidebar-icon-btn ${activeDrawer === 'notifications' ? 'sidebar-btn-active' : ''}`}
          onClick={() => openDrawer('notifications')}
          aria-label="Notifications"
          title="Notifications"
        >
          {unreadCount > 0 ? (
            <div className="sidebar-bell-wrapper">
              <BellDot size={20} />
              <span className="sidebar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          ) : (
            <Bell size={20} />
          )}
        </button>
      </div>

      {/* Backdrop — rendered via portal-like placement outside the pill */}
      {activeDrawer && (
        <div
          className="drawer-backdrop"
          onClick={closeDrawer}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
        />
      )}

      {/* Slide-in Drawer */}
      <div
        ref={drawerRef}
        className={`sidebar-drawer ${activeDrawer ? 'drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-inner">
          {/* Drawer close */}
          <button className="drawer-close-btn" onClick={closeDrawer} aria-label="Close">
            <X size={16} />
          </button>

          {/* ── PROFILE DRAWER ── */}
          {activeDrawer === 'profile' && (
            <div className="drawer-profile">
              <div className="drawer-profile-top">
                <div className="drawer-avatar-large">{getInitials(user.name)}</div>
                <div className="drawer-user-info">
                  <h3 className="drawer-user-name">{user.name || user.username}</h3>
                  <p className="drawer-user-email">{user.email}</p>
                  {user.username && user.name !== user.username && (
                    <span className="drawer-username">@{user.username}</span>
                  )}
                </div>
              </div>

              <div className="drawer-divider" />

              {/* Family section inside profile */}
              <FamilyPanel onFamilyUpdate={onFamilyUpdate} onCreateFamily={() => { closeDrawer(); onCreateFamily && onCreateFamily() }} onBudgetUpdate={onBudgetUpdate} />

              <div className="drawer-divider" />

              <button id="logout-btn" className="drawer-logout-btn" onClick={onLogout}>
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS DRAWER ── */}
          {activeDrawer === 'notifications' && (
            <div className="drawer-notifications">
              <div className="drawer-notif-header">
                <h3 className="drawer-notif-title">Notifications</h3>
                {unreadCount > 0 && (
                  <button className="drawer-mark-all-btn" onClick={handleMarkAllRead}>
                    <Check size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {notifsLoading && notifications.length === 0 ? (
                <div className="drawer-notif-empty">
                  <div className="notif-spinner" />
                  <span>Loading…</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="drawer-notif-empty">
                  <Bell size={32} className="notif-empty-icon" />
                  <p>You're all caught up!</p>
                  <span>No new notifications</span>
                </div>
              ) : (
                <div className="drawer-notif-list">
                  {notifications.map(notif => {
                    const meta = notifMeta[notif.type] || notifMeta.general
                    const isActing = actionLoading[notif._id]
                    return (
                      <div
                        key={notif._id}
                        className={`notif-card ${meta.colorClass} ${!notif.read ? 'notif-unread' : ''}`}
                      >
                        <div className="notif-card-top">
                          <span className="notif-type-tag">{meta.label}</span>
                          <div className="notif-card-right">
                            <span className="notif-time">{formatTime(notif.createdAt)}</span>
                            <button
                              className="notif-dismiss-btn"
                              onClick={() => handleDismiss(notif._id)}
                              disabled={!!isActing}
                              aria-label="Dismiss"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="notif-message">{notif.message}</p>

                        {/* Accept/Reject buttons for family invites */}
                        {notif.type === 'family_invite' && notif.inviteData?.inviteId && (
                          <div className="notif-actions">
                            <button
                              className="notif-action-btn notif-accept"
                              onClick={() => handleAcceptInvite(notif)}
                              disabled={!!isActing}
                            >
                              {isActing === 'accept' ? (
                                <div className="notif-btn-spinner" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Accept
                            </button>
                            <button
                              className="notif-action-btn notif-reject"
                              onClick={() => handleRejectInvite(notif)}
                              disabled={!!isActing}
                            >
                              {isActing === 'reject' ? (
                                <div className="notif-btn-spinner" />
                              ) : (
                                <XCircle size={14} />
                              )}
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
