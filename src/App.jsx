import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { api } from './api/api'
import HeaderBar from './components/HeaderBar/HeaderBar'
import SpendCard from './components/SpendCard/SpendCard'
import TransactionList from './components/TransactionList/TransactionList'
import AddTransactionCard from './components/AddTransactionCard/AddTransactionCard'
import BudgetEditor from './components/BudgetEditor/BudgetEditor'
import CreateFamilyWizard from './components/CreateFamilyWizard/CreateFamilyWizard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

// ── Protected Dashboard ──────────────────────────────────────────
function Dashboard() {
  const { user, logout, updateUser } = useAuth()

  const [budgetType, setBudgetType] = useState('Personal')
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [txCount, setTxCount] = useState(0) // Trigger to refresh SpendCard
  const [showWizard, setShowWizard] = useState(false)
  // Show welcome prompt once for users with no family
  const [showOnboarding, setShowOnboarding] = useState(!user?.familyId)

  const loadTransactions = useCallback(async (silent = false) => {
    try {
      if (!silent) setTxLoading(true)
      const data = await api.getExpenses() // Fetch all transactions (personal + shared)
      const mapped = (data.expenses || []).map(exp => ({
        _id: exp._id,
        title: exp.description,
        category: exp.category,
        type: exp.type === 'shared' ? 'Family' : 'Personal',
        amount: exp.amount,
        time: new Date(exp.date).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit'
        })
      }))
      setTransactions(mapped)
    } catch {
      setTransactions([])
    } finally {
      if (!silent) setTxLoading(false)
    }
  }, [])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  const handleAddTransaction = useCallback((newTx) => {
    setTransactions(prev => [newTx, ...prev])
    setTxCount(prev => prev + 1) // Force SpendCard to refresh spending values
    // Reload silently in the background so the list doesn't flicker or show a spinner
    loadTransactions(true)
  }, [loadTransactions])

  const handleFamilyUpdate = useCallback(() => {
    api.me().then(data => {
      updateUser(data.user)
      setShowOnboarding(!data.user?.familyId)
    }).catch(() => { })
  }, [updateUser])

  const handleWizardComplete = useCallback((family) => {
    updateUser({ familyId: family._id })
    setShowWizard(false)
    setShowOnboarding(false)
  }, [updateUser])

  return (
    <div className="welcome-screen">
      <div className="ambient-bg">
        <div className="blob blob-yellow"></div>
        <div className="blob blob-purple"></div>
        <div className="blob blob-pink"></div>
      </div>

      <div className="main-content">
        <div className="left-column">
          <SpendCard budgetType={budgetType} setBudgetType={setBudgetType} refreshTrigger={txCount} />

          {/* Personal budget editor — always visible in left column */}
          <div className="budget-section-card">
            <BudgetEditor type="personal" label="Personal Monthly Budget" />
          </div>

          <AddTransactionCard
            onAddTransaction={handleAddTransaction}
            budgetType={budgetType}
            setBudgetType={setBudgetType}
          />

          {/* New-user onboarding prompt */}
          {showOnboarding && !user?.familyId && (
            <div className="onboarding-card">
              <div className="onboarding-glow" />
              <div className="onboarding-content">
                <Sparkles size={20} className="onboarding-icon" />
                <div>
                  <h4 className="onboarding-title">Create a family group</h4>
                  <p className="onboarding-text">
                    Track shared expenses, set a family budget, and invite members.
                  </p>
                </div>
              </div>
              <div className="onboarding-actions">
                <button className="onboarding-btn-primary" onClick={() => setShowWizard(true)}>
                  <Sparkles size={13} /> Get started
                </button>
                <button className="onboarding-btn-dismiss" onClick={() => setShowOnboarding(false)}>
                  Maybe later
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="right-column">
          <TransactionList
            budgetType={budgetType}
            transactions={transactions}
            loading={txLoading}
          />
        </div>
      </div>

      <HeaderBar
        user={user || { name: 'Guest', email: '' }}
        onLogout={logout}
        onFamilyUpdate={handleFamilyUpdate}
        onCreateFamily={() => setShowWizard(true)}
      />

      {/* Family creation wizard */}
      {showWizard && (
        <CreateFamilyWizard
          onComplete={handleWizardComplete}
          onDismiss={() => setShowWizard(false)}
        />
      )}
    </div>
  )
}

// ── Route guard ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
