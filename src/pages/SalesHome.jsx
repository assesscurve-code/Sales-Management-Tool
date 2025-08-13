import React, { useEffect, useMemo, useState } from 'react'
import TabBtn from '../components/common/TabBtn.jsx'
import CreateSchool from '../features/schools/CreateSchool.jsx'
import SchoolList from '../features/schools/SchoolList.jsx'
import SchoolDetail from '../features/schools/SchoolDetail.jsx'
import VisitsTable from '../features/visits/VisitsTable.jsx'
import Notice from '../components/common/Notice.jsx'
import { useAuthContext } from '../context/AuthContext.jsx'
import { supabase } from '../../supabase.js'
import { fetchProfilesMap } from '../services/profiles'
import { waitBestLocation } from '../utils/geo.js'           // <-- NEW

export default function SalesHome(){
  const { session } = useAuthContext()
  const userId = session?.id

  const [schools, setSchools] = useState([])
  const [visits, setVisits] = useState([])
  const [followups, setFollowups] = useState([])
  const [profilesMap, setProfilesMap] = useState({})
  const [tab, setTab] = useState('schools')
  const [selectedId, setSelectedId] = useState(null)
  const [waitingGps, setWaitingGps] = useState(false)        // <-- NEW

  const selected = schools.find(s => s.id === selectedId) || null
  const visitsForSelectedSchool = visits.filter(v => v.school_id === selectedId)
  const followupsForSelectedSchool = followups.filter(f => f.school_id === selectedId)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const [{ data: s }, { data: v }, { data: f }, map] = await Promise.all([
        supabase.from('schools').select('*').eq('created_by', userId).order('created_at', { ascending: false }),
        supabase.from('visits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('followups').select('*').eq('user_id', userId).order('due_date', { ascending: true }),
        fetchProfilesMap(),
      ])
      setSchools(s || [])
      setVisits(v || [])
      setFollowups(f || [])
      setProfilesMap(map)
    })()
  }, [userId])

  const refreshVisits = async () => {
    const { data } = await supabase.from('visits').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setVisits(data || [])
  }
  const refreshSchools = async () => {
    const { data } = await supabase.from('schools').select('*').eq('created_by', userId).order('created_at', { ascending: false })
    setSchools(data || [])
  }
    // === Alerts: upcoming follow-ups (0–2 days), overdue, and 7-day inactivity ===
  const today = new Date()
  const alerts = useMemo(() => {
    // UPCOMING: due today, in 1 day, or in 2 days
    const upcomingFu = followups
      .filter(f => f.status === 'pending')
      .map(f => ({ f, days: daysBetween(today, f.due_date) })) // days until due_date
      .filter(x => x.days >= 0 && x.days <= 2)
      .map(({ f, days }) => {
        const schoolName = schools.find(s => s.id === f.school_id)?.name || 'Unknown'
        const when = days === 0 ? 'TODAY' : days === 1 ? 'in 1 day' : `in ${days} days`
        return {
          primary: `Follow-up ${when}`,
          secondary: `${schoolName}${f.remark ? ` — ${f.remark}` : ''}`,
        }
      })

    // OVERDUE
    const overdueFu = followups
      .filter(f => f.status === 'pending' && new Date(f.due_date) < new Date(today.toDateString()))
      .map(f => ({
        primary: `Overdue follow-up: ${dateStr(f.due_date)}`,
        secondary: (schools.find(s => s.id === f.school_id)?.name || 'Unknown') + (f.remark ? ` — ${f.remark}` : ''),
      }))

    // INACTIVITY: last activity > 7 days (only active schools)
    const inactive = schools
      .filter(s => s.status !== 'cold')
      .map(s => ({ school: s, last: maxDate(visits.filter(v => v.school_id === s.id).map(v => v.date)) }))
      .filter(x => x.last && daysBetween(x.last, today) > 7)
      .map(x => ({
        primary: `No activity for ${x.school.name}`,
        secondary: `Last meeting on ${dateStr(x.last)} (${daysBetween(x.last, today)} days ago)`,
      }))

    return [...upcomingFu, ...overdueFu, ...inactive]
  }, [followups, schools, visits])

  const refreshFollowups = async () => {
    const { data } = await supabase.from('followups').select('*').eq('user_id', userId).order('due_date', { ascending: true })
    setFollowups(data || [])
  }

  // (alerts code unchanged; omitted for brevity)

  return (
    <div className="space-y-6">
      {/* full-screen loading overlay while we wait for a precise GPS fix */}
      {waitingGps && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/25">
          <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow">
            Getting precise location…
          </div>
        </div>
      )}

      <Notice title="Your Alerts" items={alerts} emptyText="You're all caught up!" />

      <nav className="flex gap-2">
        <TabBtn active={tab === 'schools'} onClick={()=>setTab('schools')}>Schools</TabBtn>
        <TabBtn active={tab === 'visits'} onClick={()=>setTab('visits')}>My Activities</TabBtn>
      </nav>

      {tab === 'schools' && (
        <>
          <div className="min-h-[50vh]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <CreateSchool onCreate={async (payload) => {
                  const insert = { ...payload, created_by: userId }
                  const { data, error } = await supabase
                    .from('schools')
                    .insert(insert)
                    .select('id')
                    .single()
                  if (error) { alert(error.message); return null }
                  await refreshSchools()
                  setSelectedId(data?.id || null)
                  return data?.id
                }} />
              </div>
              <div className="md:col-span-2">
                {selected ? (
                  <SchoolDetail
                    key={selected.id}
                    school={selected}
                    visitsForSchool={visitsForSelectedSchool}
                    followupsForSchool={followupsForSelectedSchool}
                    onSave={async (updates) => {
                      const { error } = await supabase.from('schools').update(updatesToSnake(updates)).eq('id', selected.id)
                      if (error) return alert(error.message)
                      await refreshSchools()
                    }}
                    onAddVisit={async (v) => {
                      try {
                        // 1) show overlay and wait (max 20s) for a good fix; stop early if <=50m
                        setWaitingGps(true)
                        const loc = await waitBestLocation({ maxWaitMs: 60000, goodEnough: 50 })
                        if (!loc) {
                          alert('Location permission blocked. Please enable location and try again.')
                          return
                        }

                        // 2) only now insert the visit with precise coordinates
                        const payload = {
                          school_id: selected.id,
                          user_id: userId,
                          date: v.date,
                          remark: v.remark,
                          // store where it was logged
                          lat: loc.lat,
                          lng: loc.lng,
                          loc_accuracy: loc.accuracy,
                          loc_captured_at: new Date().toISOString(),
                        }
                        const { error } = await supabase.from('visits').insert(payload)
                        if (error) return alert(error.message)

                        await refreshVisits()
                        alert('Visit saved') // <-- show message AFTER we have the location
                      } finally {
                        setWaitingGps(false)
                      }
                    }}
                    onAddFollowUp={async (f) => {
                      const insert = { school_id: selected.id, user_id: userId, due_date: f.due_date, remark: f.remark, status: 'pending' }
                      const { error } = await supabase.from('followups').insert(insert)
                      if (error) return alert(error.message)
                      await refreshFollowups()
                    }}
                    onCompleteFollowUp={async (id) => {
                      const { error } = await supabase.from('followups').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id)
                      if (error) return alert(error.message)
                      await refreshFollowups()
                    }}
                    onMarkCold={async (reason) => {
                      const { error } = await supabase.from('schools').update({ status: 'cold', cold_reason: reason, cold_set_by: userId, cold_set_at: new Date().toISOString() }).eq('id', selected.id)
                      if (error) return alert(error.message)
                      await refreshSchools()
                    }}
                  />
                ) : (
                  <div className="rounded-2xl border p-8 text-center text-gray-500">Select a school to manage meetings & follow-ups.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="text-sm font-semibold">Your Schools</div>
            <SchoolList schools={schools} onSelect={setSelectedId} selectedId={selectedId} />
          </div>
        </>
      )}

      {tab === 'visits' && (
        <VisitsTable visits={visits} schools={schools} usersMap={profilesMap} />
      )}
    </div>
  )
}

function updatesToSnake(u){
  const out = {}
  Object.entries(u).forEach(([k,v])=>{
    const key = k.replace(/[A-Z]/g, (m)=>'_'+m.toLowerCase())
    out[key] = v
  })
  return out
}
function dateStr(d){ return new Date(d).toLocaleDateString() }
function daysBetween(a, b){
  const da = new Date(new Date(a).toDateString())
  const db = new Date(new Date(b).toDateString())
  return Math.round((db - da) / (1000*60*60*24))
}
function maxDate(arr){ if (!arr || arr.length===0) return null; return arr.reduce((m,x)=> (new Date(x) > new Date(m) ? x : m)) }