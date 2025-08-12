import React, { useState } from 'react'

export default function FollowUpForm({ onAdd }){
  const [due, setDue] = useState(new Date().toISOString().slice(0,10))
  const [remark, setRemark] = useState('')
  const submit = async (e) => { e.preventDefault(); await onAdd({ due_date: due, remark }); setRemark(''); alert('Follow-up added') }
  return (
    <form onSubmit={submit}>
      <div className="mb-2 text-sm font-semibold">Schedule Follow-up</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Follow-up Date</label>
          <input type="date" className="mt-1 w-full rounded-xl border p-2" value={due} onChange={(e)=>setDue(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="text-sm">Remark</label>
          <textarea rows={3} className="mt-1 w-full rounded-xl border p-2" value={remark} onChange={(e)=>setRemark(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex justify-end"><button className="rounded-xl bg-black px-4 py-2 text-white">Add Follow-up</button></div>
    </form>
  )
}