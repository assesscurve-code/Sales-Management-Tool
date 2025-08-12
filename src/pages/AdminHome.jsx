import React, { useEffect, useMemo, useState } from 'react'
import StatCard from '../components/common/StatCard.jsx'
import Notice from '../components/common/Notice.jsx'
import VisitsTable from '../features/visits/VisitsTable.jsx'
import { supabase } from '../../supabase.js'
import { fetchProfilesMap } from '../services/profiles'

export default function AdminHome(){
  const [schools, setSchools] = useState([])
  const [visits, setVisits] = useState([])
  const [followups, setFollowups] = useState([])
  const [profilesMap, setProfilesMap] = useState({})
  const [q, setQ] = useState('')

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: v }, { data: f }, map] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('visits').select('*').order('created_at', { ascending: false }),
        supabase.from('followups').select('*').order('due_date', { ascending: true }),
        fetchProfilesMap(),
      ])
      setSchools(s || [])
      setVisits(v || [])
      setFollowups(f || [])
      setProfilesMap(map)
    })()
  }, [])

  const today = new Date()
  const alerts = useMemo(() => {
    const midnight = new Date(today.toDateString())
    const overdueFu = followups
      .filter(f => f.status === 'pending' && new Date(f.due_date) < midnight)
      .map(f => ({
        primary: `Overdue follow-up: ${new Date(f.due_date).toLocaleDateString()}`,
        secondary:
          `${schools.find(s => s.id === f.school_id)?.name || 'Unknown'} · ` +
          `${profilesMap[f.user_id]?.name || 'User'}` +
          (f.remark ? ` — ${f.remark}` : ''),
      }))

    const inactive = schools
      .filter(s => s.status !== 'cold')
      .map(s => ({ school: s, last: maxDate(visits.filter(v => v.school_id === s.id).map(v => v.date)) }))
      .filter(x => x.last && daysBetween(x.last, today) > 7)
      .map(x => ({
        primary: `No activity for ${x.school.name}`,
        secondary: `Last meeting on ${new Date(x.last).toLocaleDateString()} (${daysBetween(x.last, today)} days)`,
      }))

    const colds = schools
      .filter(s => s.status === 'cold')
      .map(s => ({ primary: `COLD: ${s.name}`, secondary: s.cold_reason || '—' }))

    return [...overdueFu, ...inactive, ...colds]
  }, [followups, schools, visits, profilesMap])

  const filtered = visits.filter(vv => {
    const s = schools.find(x => x.id === vv.school_id)
    const u = profilesMap[vv.user_id]
    const hay = [s?.name, u?.name, vv.remark, vv.date].join(' ').toLowerCase()
    return hay.includes(q.toLowerCase())
  })

  return (
    <div className="space-y-4">
      <Notice title="Admin Alerts" items={alerts} emptyText="No alerts" />

      <div className="rounded-2xl border p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">All Employees – Activities</div>
          <input
            placeholder="Search by school/sales/remark…"
            className="w-80 rounded-xl border p-2"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </div>
        <VisitsTable visits={filtered} schools={schools} usersMap={profilesMap} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Schools" value={schools.length} />
        <StatCard title="Total Activities" value={visits.length} />
        <StatCard
          title="Overdue Follow-ups"
          value={alerts.filter(a => a.primary.startsWith('Overdue')).length}
        />
      </div>
    </div>
  )
}

function daysBetween(a, b){
  const da = new Date(new Date(a).toDateString())
  const db = new Date(new Date(b).toDateString())
  return Math.round((db - da) / (1000*60*60*24))
}
function maxDate(arr){
  if (!arr || arr.length === 0) return null
  return arr.reduce((m,x)=> (new Date(x) > new Date(m) ? x : m))
}
