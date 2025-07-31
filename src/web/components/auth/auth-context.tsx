'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('xbot-auth-token')
    if (token) {
      // In a real app, you'd validate the token
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = async (password: string): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)

      // In a real app, you'd make an API call to validate the password
      // For now, we'll use a simple check against an environment variable
      const expectedPassword = process.env.NEXT_PUBLIC_WEB_PASSWORD || 'admin123'
      
      if (password === expectedPassword) {
        const token = btoa(`xbot-auth-${Date.now()}`)
        localStorage.setItem('xbot-auth-token', token)
        setIsAuthenticated(true)
        return true
      } else {
        setError('Invalid password')
        return false
      }
    } catch (err) {
      setError('Authentication failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('xbot-auth-token')
    setIsAuthenticated(false)
    setError(null)
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 