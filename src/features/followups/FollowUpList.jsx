import React from 'react'

export default function FollowUpList({ items = [], onComplete }){
  if (!items || items.length === 0) return <div className="rounded-xl border p-6 text-center text-gray-500">No follow-ups</div>
  const byDate = items.slice().sort((a,b)=> new Date(a.due_date) - new Date(b.due_date))
  return (
    <ul className="max-h-64 space-y-2 overflow-auto">
      {byDate.map(f => (
        <li key={f.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
          <div>
            <div className="font-medium">{f.due_date} · {f.status.toUpperCase()}</div>
            <div className="text-gray-600">{f.remark || '—'}</div>
          </div>
          {f.status === 'pending' ? (
            <button className="rounded-xl border px-3 py-1" onClick={()=>onComplete(f.id)}>Mark Done</button>
          ) : (
            <span className="text-xs text-gray-400">Done</span>
          )}
        </li>
      ))}
    </ul>
  )
}