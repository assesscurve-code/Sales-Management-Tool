import React, { useState } from 'react'
import FollowUpForm from '../followups/FollowUpForm.jsx'
import FollowUpList from '../followups/FollowUpList.jsx'

export default function SchoolDetail({ school, visitsForSchool = [], followupsForSchool = [], onSave, onAddVisit, onAddFollowUp, onCompleteFollowUp, onMarkCold }){
  const [form, setForm] = useState({
    ownerName: school.owner_name || '',
    ownerPhone: school.owner_phone || '',
    ownerEmail: school.owner_email || '',
    pocName: school.poc_name || '',
    pocPhone: school.poc_phone || '',
    pocEmail: school.poc_email || '',
  })

  const saveDetails = async (e) => {
    e.preventDefault()
    await onSave(form)
    alert('Changes saved')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-5">
        <div className="mb-2 text-sm font-semibold">School: {school.name}</div>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div>Address: {school.address || '—'}</div>
          <div>City/State: {school.city || '—'} / {school.state || '—'}</div>
          <div>Pincode: {school.pincode || '—'}</div>
          <div>Status: <span className={"inline-block rounded px-2 py-0.5 text-xs " + (school.status==='cold' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')}>{school.status?.toUpperCase()}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Owner/POC details */}
        <form onSubmit={saveDetails} className="rounded-2xl border p-5">
          <div className="mb-2 text-sm font-semibold">Owner & POC</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm">Owner Name</label>
              <input className="mt-1 w-full rounded-xl border p-2" value={form.ownerName} onChange={(e)=>setForm({...form, ownerName:e.target.value})} />
            </div>
            <div>
              <label className="text-sm">Phone</label>
              <input className="mt-1 w-full rounded-xl border p-2" value={form.ownerPhone} onChange={(e)=>setForm({...form, ownerPhone:e.target.value})} />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input type="email" className="mt-1 w-full rounded-xl border p-2" value={form.ownerEmail} onChange={(e)=>setForm({...form, ownerEmail:e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="text-sm">POC Name</label>
              <input className="mt-1 w-full rounded-xl border p-2" value={form.pocName} onChange={(e)=>setForm({...form, pocName:e.target.value})} />
            </div>
            <div>
              <label className="text-sm">POC Phone</label>
              <input className="mt-1 w-full rounded-xl border p-2" value={form.pocPhone} onChange={(e)=>setForm({...form, pocPhone:e.target.value})} />
            </div>
            <div>
              <label className="text-sm">POC Email</label>
              <input type="email" className="mt-1 w-full rounded-xl border p-2" value={form.pocEmail} onChange={(e)=>setForm({...form, pocEmail:e.target.value})} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded-xl bg-black px-4 py-2 text-white">Save Details</button>
          </div>
        </form>

        {/* Meetings & Follow-ups */}
        <div className="space-y-4">
          {/* Meeting (visit) form */}
          <div className="rounded-2xl border p-5">
            <VisitForm onAdd={onAddVisit} />
          </div>
          {/* Follow-up form */}
          <div className="rounded-2xl border p-5">
            <FollowUpForm onAdd={onAddFollowUp} />
          </div>
          {/* Lists */}
          <div className="rounded-2xl border p-5">
            <div className="mb-2 text-sm font-semibold">Past Meetings</div>
            <ul className="max-h-64 space-y-2 overflow-auto">
              {visitsForSchool
                .slice()
                .sort((a,b)=> new Date(b.date) - new Date(a.date))
                .map(v => (
                  <li key={v.id} className="flex items-start justify-between rounded-xl border p-3">
                    <div>
                      <div className="font-medium">{v.date}</div>
                      <div className="text-sm text-gray-600">{v.remark || '—'}</div>
                    </div>
                    <div className="text-xs text-gray-400">Logged {new Date(v.created_at).toLocaleString()}</div>
                  </li>
                ))}
              {visitsForSchool.length === 0 && (<li className="rounded-xl border p-6 text-center text-gray-500">No meetings yet</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border p-5">
            <div className="mb-2 text-sm font-semibold">Follow-ups</div>
            <FollowUpList items={followupsForSchool} onComplete={onCompleteFollowUp} />
          </div>

          {/* Cold stage */}
          <div className="rounded-2xl border p-5">
            <ColdForm status={school.status} onMarkCold={onMarkCold} />
            {school.status==='cold' && school.cold_reason && (
              <div className="mt-3 text-sm text-gray-600">Reason: {school.cold_reason}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VisitForm({ onAdd }){
  const [visit, setVisit] = useState({ date: new Date().toISOString().slice(0,10), remark: '' })
  const clear = () => setVisit({ date: new Date().toISOString().slice(0,10), remark: '' })
  const submit = async (e) => {
  e.preventDefault();
  await onAdd({ date: visit.date, remark: visit.remark });
  // alert('Visit saved');                     // show message first
  setVisit(v => ({ ...v, remark: '' }));    // then blank just the remark
  };
  return (
    <form onSubmit={submit}>
      <div className="mb-2 text-sm font-semibold">Add Meeting / Visit</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Meeting Date</label>
          <input type="date" className="mt-1 w-full rounded-xl border p-2" value={visit.date} onChange={(e)=>setVisit({...visit, date:e.target.value})} />
        </div>
        <div className="col-span-2">
          <label className="text-sm">Remark</label>
          <textarea className="mt-1 w-full rounded-xl border p-2" rows={3} value={visit.remark} onChange={(e)=>setVisit({...visit, remark:e.target.value})} />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="rounded-xl bg-black px-4 py-2 text-white">Save Visit</button>
      </div>
    </form>
  )
}

function ColdForm({ status, onMarkCold }){
  const [reason, setReason] = useState('')
  if (status==='cold') return (
    <div>
      <div className="mb-2 text-sm font-semibold">This school is marked COLD</div>
      <button className="rounded-xl border px-3 py-1 text-xs" disabled>Marked Cold</button>
    </div>
  )
  const submit = async (e) => { e.preventDefault(); if (!reason.trim()) return alert('Please enter a reason'); await onMarkCold(reason); setReason(''); alert('Marked as cold'); }
  return (
    <form onSubmit={submit}>
      <div className="mb-2 text-sm font-semibold">Mark as Cold</div>
      <textarea rows={3} className="w-full rounded-xl border p-2" placeholder="Why is this school going cold?" value={reason} onChange={(e)=>setReason(e.target.value)} />
      <div className="mt-2 flex justify-end"><button className="rounded-xl bg-rose-600 px-3 py-1.5 text-white">Mark Cold</button></div>
    </form>
  )
}