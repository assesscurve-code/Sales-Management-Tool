import React, { useState } from 'react'

export default function SchoolList({ schools, onSelect, selectedId }){
  const [q, setQ] = useState('')
  const filtered = schools.filter(s => [s.name, s.city, s.state].join(' ').toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Select Existing School</div>
        <input placeholder="Search…" className="w-full sm:w-40 rounded-xl border p-2 text-sm" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>
      <div className="max-h-80 space-y-2 overflow-auto">
        {filtered.map(s => (
          <button key={s.id} onClick={()=>onSelect(s.id)} className={"flex w-full items-start justify-between rounded-xl border p-3 text-left " + (selectedId === s.id ? 'bg-gray-50' : '')}>
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-gray-500">{s.city || ''} {s.state || ''}</div>
            </div>
            <span className="text-xs text-gray-400">{selectedId === s.id ? 'Selected' : ''}</span>
          </button>
        ))}
        {filtered.length === 0 && <div className="rounded-xl border p-6 text-center text-gray-500">No schools found</div>}
      </div>
    </div>
  )
}