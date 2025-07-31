'use client'

import { useState } from 'react'

interface LoginFormProps {
  onLogin: (password: string) => void
  error?: string
}

export default function LoginForm({ onLogin, error }: LoginFormProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="material-card w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-headline mb-2">XBot Dashboard</h1>
          <p className="text-body">Enter password to access bot configuration</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-title mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter password"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
          
          <button type="submit" className="btn-primary w-full">
            Login
          </button>
        </form>
      </div>
    </div>
  )
} 