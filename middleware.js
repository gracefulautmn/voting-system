// File: middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Jika mencoba mengakses halaman admin tanpa login, redirect ke login admin
  if (req.nextUrl.pathname.startsWith('/admin/dashboard') && !session) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Jika mencoba mengakses halaman voting tanpa login, redirect ke login
  if (req.nextUrl.pathname.startsWith('/voting') && !session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/voting/:path*', '/admin/dashboard/:path*'],
}