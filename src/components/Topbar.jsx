import React from 'react'
import { useAuthContext } from '../context/AuthContext.jsx'

export default function Topbar({ profile }){
  const { logout } = useAuthContext()
  return (
    <div className="sticky top-0 z-40 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/80 p-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">SM</div>
        <div className="text-base sm:text-lg font-semibold">Sales Management Tool</div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
        {profile ? (
          <>
            <span className="text-gray-600">{profile.name} · {profile.role?.toUpperCase()}</span>
            <button className="rounded-xl border px-3 py-1" onClick={logout}>Logout</button>
          </>
        ) : (
          <span className="text-gray-500">Please log in</span>
        )}
      </div>
    </div>
  )
}