// File: lib/supabase-provider.js
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const SupabaseContext = createContext(null)

export const SupabaseProvider = ({ children }) => {
  const [supabase] = useState(() => createClientComponentClient())
  const [user, setUser] = useState(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ supabase, user }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === null) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}