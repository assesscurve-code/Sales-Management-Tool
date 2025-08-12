import React from 'react'

export default function Notice({ title, items = [], emptyText = 'No alerts' }){
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {items.length === 0 ? (
        <div className="rounded-xl border p-4 text-center text-gray-500">{emptyText}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start justify-between rounded-xl border p-3 text-sm">
              <div>
                <div className="font-medium">{it.primary}</div>
                {it.secondary && <div className="text-gray-600">{it.secondary}</div>}
              </div>
              {it.action}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
