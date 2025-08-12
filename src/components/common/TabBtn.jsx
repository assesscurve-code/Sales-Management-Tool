import React from 'react'
export default function TabBtn({ active, children, onClick }){
  return (
    <button className={"rounded-xl px-3 py-1.5 text-sm " + (active ? "bg-black text-white" : "border hover:bg-gray-50")} onClick={onClick}>
      {children}
    </button>
  )
}