import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('quaestor_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('quaestor_token') || null)

  const login = useCallback(async (username, password) => {
    const data = await api.login({ username, password })
    localStorage.setItem('quaestor_token', data.token)
    localStorage.setItem('quaestor_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (name, username, email, password) => {
    const data = await api.register({ name, username, email, password })
    localStorage.setItem('quaestor_token', data.token)
    localStorage.setItem('quaestor_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('quaestor_token')
    localStorage.removeItem('quaestor_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('quaestor_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
