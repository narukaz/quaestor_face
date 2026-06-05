import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      {/* Ambient background */}
      <div className="auth-ambient">
        <div className="auth-blob auth-blob-yellow" />
        <div className="auth-blob auth-blob-purple" />
        <div className="auth-blob auth-blob-pink" />
      </div>

      <div className="auth-card">
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">Sign in to your expense tracker</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-error-box">{error}</div>}

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-username">Username or Email</label>
            <input
              id="login-username"
              type="text"
              className={`auth-input ${error && !username ? 'error' : ''}`}
              placeholder="your_username or email@example.com"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className={`auth-input ${error && !password ? 'error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
