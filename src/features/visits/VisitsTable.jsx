import React from 'react'

export default function VisitsTable({ visits, schools, usersMap }){
  const schoolById = (id) => schools.find(s => s.id === id) || { name: '—' }
  return (
    <div className="rounded-2xl border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-600">
            <th className="p-3">Date</th>
            <th className="p-3">School</th>
            <th className="p-3">Sales Person</th>
            <th className="p-3">Remark</th>
            <th className="p-3">Logged</th>
          </tr>
        </thead>
        <tbody>
          {visits.map(v => (
            <tr key={v.id} className="border-t">
              <td className="p-3">{v.date}</td>
              <td className="p-3">{schoolById(v.school_id).name}</td>
              <td className="p-3">{usersMap[v.user_id]?.name || '—'}</td>
              <td className="p-3">{v.remark || '—'}</td>
              <td className="p-3 text-gray-500">{new Date(v.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {visits.length === 0 && (
            <tr>
              <td className="p-8 text-center text-gray-500" colSpan={5}>No activities yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}