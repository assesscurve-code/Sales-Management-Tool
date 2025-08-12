import React, { useEffect, useState, createContext, useContext } from 'react'
import { supabase } from '../../supabase'

const KEY = 'smt_session'
const AuthContext = createContext({ session: null, login: async ()=>{}, logout: ()=>{} })

export function AuthProvider({ children }){
  const [session, setSession] = useState(null) // { id, name, email, role }

  useEffect(() => {
    const raw = localStorage.getItem(KEY)
    if (raw) { try { setSession(JSON.parse(raw)) } catch {} }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase
      .from('profiles')                                // <- supabase-js uses .from, not .table
      .select('id,name,email,role')                    // only what you need
      .eq('email', email)                              // exact email match
      .eq('password_hash', password)                        // exact password match (plaintext)
      .maybeSingle()                                   // 0 or 1 row

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Invalid email or password')

    const user = { id: data.id, name: data.name, email: data.email, role: data.role }
    setSession(user)
    localStorage.setItem(KEY, JSON.stringify(user))
  }

  const logout = () => {
    setSession(null)
    localStorage.removeItem(KEY)
  }

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(){ return useContext(AuthContext) }
