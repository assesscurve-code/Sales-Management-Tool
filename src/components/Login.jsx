import React, { useState } from 'react'
import { useAuthContext } from '../context/AuthContext.jsx'

export default function Login(){
  const { login } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)      // <- calls RPC login_user
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border p-6 shadow-sm">
      <div className="mb-4 text-center">
        <div className="text-xl font-semibold">Login</div>
        <div className="text-xs text-gray-500">Enter email & password</div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-sm">Email</label>
          <input className="mt-1 w-full rounded-xl border p-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input type="password" className="mt-1 w-full rounded-xl border p-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-black px-4 py-2 text-white">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}