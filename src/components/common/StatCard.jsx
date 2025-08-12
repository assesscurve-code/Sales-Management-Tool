import React from 'react'
export default function StatCard({ title, value, subtitle }){
  return (
    <div className="rounded-2xl border p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
  )
}