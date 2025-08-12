import { useAuthContext } from '../context/AuthContext.jsx'

// With custom auth, the profile is the session itself
export default function useProfile(){
  const { session } = useAuthContext()
  return { session, profile: session, loading: false }
}