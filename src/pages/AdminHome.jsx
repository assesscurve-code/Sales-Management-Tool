// src/pages/AdminHome.jsx
import React, { useEffect, useMemo, useState } from 'react'
import StatCard from '../components/common/StatCard.jsx'
import Notice from '../components/common/Notice.jsx'
import VisitsTable from '../features/visits/VisitsTable.jsx'
import { supabase } from '../../supabase.js'

/** Normalize any id to string (so UUID/bigint/strings all compare safely) */
const sid = v => (v == null ? '' : String(v))

/** Fetch profiles safely for both schemas (id or user_id) */
async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) { console.error(error); return [] }
  return data || []
}

export default function AdminHome(){
  const [schools, setSchools] = useState([])
  const [visits, setVisits] = useState([])
  const [followups, setFollowups] = useState([])
  const [profiles, setProfiles] = useState([])

  // search bar (unchanged)
  const [q, setQ] = useState('')

  // activities filters
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [salesFilter,  setSalesFilter]  = useState('all')
  const [fromDate, setFromDate]         = useState('')
  const [toDate,   setToDate]           = useState('')

  // alerts filters
  const [alertSchool, setAlertSchool]   = useState('all')
  const [alertSales,  setAlertSales]    = useState('all')
  const [alertDayBand, setAlertDayBand] = useState('all')
  const [alertLimit, setAlertLimit] = useState(10)

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: v }, { data: f }, profs] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('visits').select('*').order('created_at', { ascending: false }),
        supabase.from('followups').select('*').order('due_date', { ascending: true }),
        fetchProfiles(),
      ])
      setSchools(s || [])
      setVisits(v || [])
      setFollowups(f || [])
      setProfiles(profs || [])
    })()
  }, [])

  /** Map profiles by BOTH keys so lookups always work */
  const profilesMap = useMemo(() => {
    const m = {}
    profiles.forEach(p => {
      if (p.id)      m[String(p.id)] = p     // custom-auth id
      if (p.user_id) m[String(p.user_id)] = p // supabase-auth user_id
    })
    return m
  }, [profiles])

  /** Salespersons dropdown options */
  const salesUsers = useMemo(() => {
    const list = profiles
      .filter(p => (p.role || '').toLowerCase() === 'sales')
      .map(p => ({ value: sid(p.user_id ?? p.id), label: p.name || p.email || '(no name)' }))
      .filter(o => o.value)
    // de-dup by value
    return Array.from(new Map(list.map(i => [i.value, i])).values())
  }, [profiles])

  // ---------- Alerts ----------
  const DAY_BANDS = [
    { label: 'All', value: 'all', min: -Infinity, max: Infinity },
    { label: '0–4 days', value: '0-4', min: 0, max: 4 },
    { label: '5–7 days', value: '5-7', min: 5, max: 7 },
    { label: '8–10 days', value: '8-10', min: 8, max: 10 },
    { label: '11+ days', value: '11+', min: 11, max: 9_999 },
  ]
  const bandFor = v => DAY_BANDS.find(b => b.value === v) || DAY_BANDS[0]

  const today = new Date()
  const d0 = d => new Date(new Date(d).toDateString())
  const daysBetween = (a, b) => Math.round((d0(b) - d0(a)) / 86400000)
  const maxDate = arr => (arr && arr.length ? arr.reduce((m,x)=> new Date(x) > new Date(m) ? x : m) : null)

  // Build alerts with metadata so we can filter them
  const rawAlerts = useMemo(() => {
    const overdue = (followups || [])
      .filter(f => f.status === 'pending' && new Date(f.due_date) < d0(today))
      .map(f => ({
        type: 'overdue',
        school_id: sid(f.school_id),
        user_id:   sid(f.user_id),
        days: daysBetween(f.due_date, today),
        primary: `Overdue follow-up: ${new Date(f.due_date).toLocaleDateString()}`,
        secondary: `${schools.find(s=>sid(s.id)===sid(f.school_id))?.name || 'Unknown'} · ${profilesMap[sid(f.user_id)]?.name || 'User'}${f.remark ? ` — ${f.remark}` : ''}`,
      }))

    const inactive = (schools || [])
      .filter(s => s.status !== 'cold')
      .map(s => {
        const last = maxDate(visits.filter(v => sid(v.school_id) === sid(s.id)).map(v => v.date))
        if (!last) return null
        const gap = daysBetween(last, today)
        return gap > 7 ? {
          type: 'inactive',
          school_id: sid(s.id),
          user_id:   sid(s.created_by),
          days: gap,
          primary: `No activity for ${s.name}`,
          secondary: `Last meeting on ${new Date(last).toLocaleDateString()} (${gap} days)`,
        } : null
      })
      .filter(Boolean)

    const colds = (schools || [])
      .filter(s => s.status === 'cold')
      .map(s => ({
        type: 'cold',
        school_id: sid(s.id),
        user_id:   sid(s.cold_set_by || s.created_by),
        days: null,
        primary: `COLD: ${s.name}`,
        secondary: s.cold_reason || '—',
      }))

    return [...overdue, ...inactive, ...colds]
  }, [followups, schools, visits, profilesMap])

  const filteredAlerts = useMemo(() => {
    const band = bandFor(alertDayBand)
    return rawAlerts.filter(a => {
      if (alertSchool !== 'all' && sid(a.school_id) !== sid(alertSchool)) return false
      if (alertSales  !== 'all' && sid(a.user_id)   !== sid(alertSales))  return false
      if ((a.type === 'overdue' || a.type === 'inactive') && a.days != null) {
        if (a.days < band.min || a.days > band.max) return false
      }
      return true
    })
  }, [rawAlerts, alertSchool, alertSales, alertDayBand])

  const alertsPage = useMemo(
      () => filteredAlerts.slice(0, Number(alertLimit || 10)),
      [filteredAlerts, alertLimit]
    )

  // ---------- Activities table filtering ----------
  const visitsFiltered = useMemo(() => {
    const base = (visits || []).filter(v => {
      if (schoolFilter !== 'all' && sid(v.school_id) !== sid(schoolFilter)) return false
      if (salesFilter  !== 'all' && sid(v.user_id)   !== sid(salesFilter))  return false
      if (fromDate && new Date(v.date) < new Date(`${fromDate}T00:00:00`)) return false
      if (toDate   && new Date(v.date) > new Date(`${toDate}T23:59:59`))   return false
      return true
    })
    // keep the existing search bar behavior
    return base.filter(vv => {
      const s = schools.find(x => sid(x.id) === sid(vv.school_id))
      const u = profilesMap[sid(vv.user_id)]
      const hay = [s?.name, u?.name, vv.remark, vv.date].join(' ').toLowerCase()
      return hay.includes(q.toLowerCase())
    })
  }, [visits, schools, profilesMap, schoolFilter, salesFilter, fromDate, toDate, q])

  return (
    <div className="space-y-4">
      {/* Admin Alerts with filters */}
      <div className="rounded-2xl border p-4">
        <div className="mb-2 text-sm font-semibold">Admin Alerts</div>
        <div className="mb-3 grid grid-cols-5 gap-3">
          <select className="rounded-xl border p-2 text-sm" value={alertSchool} onChange={e=>setAlertSchool(e.target.value || 'all')}>
            <option value="all">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="rounded-xl border p-2 text-sm" value={alertSales} onChange={e=>setAlertSales(e.target.value || 'all')}>
            <option value="all">All Salespersons</option>
            {salesUsers.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <select className="rounded-xl border p-2 text-sm" value={alertDayBand} onChange={e=>setAlertDayBand(e.target.value)}>
            <option value="all">All days</option>
            <option value="0-4">0–4 days</option>
            <option value="5-7">5–7 days</option>
            <option value="8-10">8–10 days</option>
            <option value="11+">11+ days</option>
          </select>
          <select className="rounded-xl border p-2 text-sm" value={alertLimit} onChange={(e)=>setAlertLimit(e.target.value)}>
            <option value={10}>Show 10</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
            <option value={1000}>Show 1000</option>
          </select>

          <button className="rounded-xl border p-2 text-sm" onClick={()=>{
            setAlertSchool('all'); setAlertSales('all'); setAlertDayBand('all'); setAlertLimit(10)
          }}>Reset Alerts Filters</button>
        </div>
        {/* <Notice title="Admin Alerts" items={filteredAlerts} emptyText="No alerts" /> */}
        <Notice title="Admin Alerts" items={alertsPage} emptyText="No alerts" />

      </div>

      {/* Activities (table) with filters; search bar unchanged on the right */}
      <div className="rounded-2xl border p-4">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold">All Employees – Activities</div>
          <input
            placeholder="Search by school/sales/remark…"
            className="w-full sm:w-80 rounded-xl border p-2"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </div>

        <div className="mb-3 grid grid-cols-5 gap-3">
          <select className="rounded-xl border p-2 text-sm" value={schoolFilter} onChange={e=>setSchoolFilter(e.target.value || 'all')}>
            <option value="all">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="rounded-xl border p-2 text-sm" value={salesFilter} onChange={e=>setSalesFilter(e.target.value || 'all')}>
            <option value="all">All Salespersons</option>
            {salesUsers.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          <input type="date" className="rounded-xl border p-2 text-sm" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          <input type="date" className="rounded-xl border p-2 text-sm" value={toDate} onChange={e=>setToDate(e.target.value)} />
          <button className="rounded-xl border p-2 text-sm" onClick={()=>{
            setSchoolFilter('all'); setSalesFilter('all'); setFromDate(''); setToDate('')
          }}>Reset Table Filters</button>
        </div>

        <VisitsTable visits={visitsFiltered} schools={schools} usersMap={profilesMap} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Schools" value={schools.length} />
        <StatCard title="Total Activities" value={visits.length} />
        <StatCard title="Overdue Follow-ups" value={filteredAlerts.filter(a=>a.type==='overdue').length} />
      </div>
    </div>
  )
}
