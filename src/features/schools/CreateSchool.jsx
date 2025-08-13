import React, { useState } from 'react'
import { toSnake } from '../../utils/case'

export default function CreateSchool({ onCreate }){
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', pincode: '' })
  const submit = async (e) => {
    e.preventDefault()
    await onCreate(toSnake(form))
    setForm({ name: '', address: '', city: '', state: '', pincode: '' })
    setOpen(false)
  }
  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-2 text-sm font-semibold">Create a School</div>
      {!open ? (
        <button className="w-full rounded-xl bg-black px-3 py-2 text-white" onClick={()=>setOpen(true)}>+ New School</button>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-sm">School Name</label>
            <input required className="mt-1 w-full rounded-xl border p-2" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
          </div>
          <div className="col-span-2">
            <label className="text-sm">Address</label>
            <input className="mt-1 w-full rounded-xl border p-2" value={form.address} onChange={(e)=>setForm({...form, address:e.target.value})} />
          </div>
          <div>
            <label className="text-sm">City</label>
            <input className="mt-1 w-full rounded-xl border p-2" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} />
          </div>
          <div>
            <label className="text-sm">State</label>
            <input className="mt-1 w-full rounded-xl border p-2" value={form.state} onChange={(e)=>setForm({...form, state:e.target.value})} />
          </div>
          <div className="col-span-2">
            <label className="text-sm">Pincode</label>
            <input className="mt-1 w-full rounded-xl border p-2" value={form.pincode} onChange={(e)=>setForm({...form, pincode:e.target.value})} />
          </div>
          <div className="md:col-span-2 flex justify-end"><button className="w-full md:w-auto rounded-xl bg-black px-4 py-2 text-white">Save</button></div>
        </form>
      )}
    </div>
  )
}