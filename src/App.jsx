import React from 'react'
import Topbar from './components/Topbar.jsx'
import Login from './components/Login.jsx'
import SalesHome from './pages/SalesHome.jsx'
import AdminHome from './pages/AdminHome.jsx'
import useProfile from './services/useProfile.js'

function Footer() {
  return (
    <div className="mt-10 flex items-center justify-between border-t pt-4 text-xs text-gray-500">
      <span>© {new Date().getFullYear()} Sales Management Task</span>
      <span>React + Supabase · Netlify-ready</span>
    </div>
  )
}

export default function App(){
  const { session, profile, loading } = useProfile()

  return (
    <div className="mx-auto max-w-6xl p-4">
      <Topbar profile={profile} />
      {!session ? (
        <Login />
      ) : loading ? (
        <div className="rounded-2xl border p-6">Checking permissions…</div>
      ) : profile?.role === 'admin' ? (
        <AdminHome />
      ) : (
        <SalesHome />
      )}
      <Footer />
    </div>
  )
}