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

export default function SalesHome(){
  const { session } = useAuthContext()
  const userId = session?.id

  const [schools, setSchools] = useState([])
  const [visits, setVisits] = useState([])
  const [followups, setFollowups] = useState([])
  const [profilesMap, setProfilesMap] = useState({})
  const [tab, setTab] = useState('schools')
  const [selectedId, setSelectedId] = useState(null)

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

  const refreshSchools = async () => {
    const { data } = await supabase
      .from('schools')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    setSchools(data || [])
  }
  const refreshVisits = async () => {
    const { data } = await supabase
      .from('visits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setVisits(data || [])
  }
  const refreshFollowups = async () => {
    const { data } = await supabase
      .from('followups')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
    setFollowups(data || [])
  }

  // Alerts: overdue follow-ups & 7-day inactivity since last meeting (only for active schools)
  const today = new Date()
  const alerts = useMemo(() => {
    const midnight = new Date(today.toDateString()) // strip time
    const overdueFu = followups
      .filter(f => f.status === 'pending' && new Date(f.due_date) < midnight)
      .map(f => ({
        primary: `Overdue follow-up: ${dateStr(f.due_date)}`,
        secondary: (schools.find(s => s.id === f.school_id)?.name || 'Unknown') + (f.remark ? ` — ${f.remark}` : ''),
      }))

    const inactive = schools
      .filter(s => s.status !== 'cold')
      .map(s => ({
        school: s,
        last: maxDate(visits.filter(v => v.school_id === s.id).map(v => v.date)),
      }))
      .filter(x => x.last && daysBetween(x.last, today) > 7)
      .map(x => ({
        primary: `No activity for ${x.school.name}`,
        secondary: `Last meeting on ${dateStr(x.last)} (${daysBetween(x.last, today)} days ago)`,
      }))

    return [...overdueFu, ...inactive]
  }, [followups, schools, visits])

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <Notice title="Your Alerts" items={alerts} emptyText="You're all caught up!" />

      <nav className="flex gap-2">
        <TabBtn active={tab === 'schools'} onClick={()=>setTab('schools')}>Schools</TabBtn>
        <TabBtn active={tab === 'visits'} onClick={()=>setTab('visits')}>My Activities</TabBtn>
      </nav>

      {tab === 'schools' && (
        <>
          {/* TOP HALF */}
          <div className="min-h-[50vh]">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <CreateSchool
                  onCreate={async (payload) => {
                    const insert = { ...payload, created_by: userId }
                    const { data, error } = await supabase
                      .from('schools')
                      .insert(insert)
                      .select('id')
                      .single()
                    if (error) { alert(error.message); return null }
                    await refreshSchools()
                    setSelectedId(data?.id || null) // auto-select the new school
                    return data?.id
                  }}
                />
              </div>

              <div className="col-span-2">
                {selected ? (
                  <SchoolDetail
                    key={selected.id}
                    school={selected}
                    visitsForSchool={visitsForSelectedSchool}
                    followupsForSchool={followupsForSelectedSchool}
                    onSave={async (updates) => {
                      const { error } = await supabase
                        .from('schools')
                        .update(updatesToSnake(updates))
                        .eq('id', selected.id)
                      if (error) return alert(error.message)
                      await refreshSchools()
                    }}
                    onAddVisit={async (v) => {
                      const payload = { school_id: selected.id, user_id: userId, date: v.date, remark: v.remark }
                      const { error } = await supabase.from('visits').insert(payload)
                      if (error) return alert(error.message)
                      await refreshVisits()
                    }}
                    onAddFollowUp={async (f) => {
                      const insert = {
                        school_id: selected.id,
                        user_id: userId,
                        due_date: f.due_date,
                        remark: f.remark,
                        status: 'pending',
                      }
                      const { error } = await supabase.from('followups').insert(insert)
                      if (error) return alert(error.message)
                      await refreshFollowups()
                    }}
                    onCompleteFollowUp={async (id) => {
                      const { error } = await supabase
                        .from('followups')
                        .update({ status: 'done', completed_at: new Date().toISOString() })
                        .eq('id', id)
                      if (error) return alert(error.message)
                      await refreshFollowups()
                    }}
                    onMarkCold={async (reason) => {
                      const { error } = await supabase
                        .from('schools')
                        .update({
                          status: 'cold',
                          cold_reason: reason,
                          cold_set_by: userId,
                          cold_set_at: new Date().toISOString(),
                        })
                        .eq('id', selected.id)
                      if (error) return alert(error.message)
                      await refreshSchools()
                    }}
                  />
                ) : (
                  <div className="rounded-2xl border p-8 text-center text-gray-500">
                    Select a school to manage meetings & follow-ups.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM HALF */}
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
