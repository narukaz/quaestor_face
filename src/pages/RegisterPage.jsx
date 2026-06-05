import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, username, email, password } = form
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('All fields are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(name.trim(), username.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-ambient">
        <div className="auth-blob auth-blob-yellow" />
        <div className="auth-blob auth-blob-purple" />
        <div className="auth-blob auth-blob-pink" />
      </div>

      <div className="auth-card">
        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-subheading">Start tracking your expenses today</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="auth-error-box">{error}</div>}

          <div className="auth-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                className="auth-input"
                placeholder="Omveer Singh"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
                disabled={loading}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                type="text"
                className="auth-input"
                placeholder="omveer99"
                value={form.username}
                onChange={set('username')}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              placeholder="omveer@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="auth-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <button
            id="register-submit"
            type="submit"
            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
