import { supabase } from '../../supabase.js' // Adjust the import path as necessary

export async function fetchProfilesMap(){
  const { data, error } = await supabase.from('profiles').select('id,name,role')
  if (error) { console.error(error); return {} }
  const map = {}
  data.forEach(p => { map[p.id] = p })
  return map
}