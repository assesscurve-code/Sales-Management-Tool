import React from 'react'

export default function VisitsTable({ visits, schools, usersMap, onClickSchool }){
  const schoolById = (id) => schools.find(s => s.id === id) || { name: '—' }
  const fmt = (x) => (typeof x === 'number' ? x.toFixed(4) : null)

  return (
    <div className="rounded-2xl border overflow-x-auto">
      <table className="min-w-[720px] w-full border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-600">
            <th className="p-2 sm:p-3">Date</th>
            <th className="p-2 sm:p-3">School</th>
            <th className="p-2 sm:p-3">Sales Person</th>
            <th className="p-2 sm:p-3">Remark</th>
            <th className="p-2 sm:p-3">Logged</th>
          </tr>
        </thead>
        <tbody>
          {visits.map(v => {
            const lat = fmt(v.lat), lng = fmt(v.lng)
            const link = (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : null
            return (
              <tr key={v.id} className="border-t">
                <td className="p-2 sm:p-3">{v.date}</td>
                {/* <td className="p-2 sm:p-3">{schoolById(v.school_id).name}</td> */}
                <td className="p-2 sm:p-3">{onClickSchool ? <button type="button" className="text-blue-600 hover:underline" onClick={() => onClickSchool(v.school_id)}>{schoolById(v.school_id).name}</button> : schoolById(v.school_id).name}</td>
                <td className="p-2 sm:p-3">{usersMap[v.user_id]?.name || '—'}</td>
                <td className="p-2 sm:p-3">{v.remark || '—'}</td>
                <td className="p-2 sm:p-3 text-gray-600">
                  <div>{new Date(v.created_at).toLocaleString()}</div>
                  <div className="mt-1 text-xs">
                    {link ? <a className="underline" href={link} target="_blank" rel="noreferrer">📍 {lat}, {lng}</a> : <span className="text-gray-400">No location</span>}
                  </div>
                </td>
              </tr>
            )
          })}
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
