import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

const BASE_URL = 'https://focoenem2.onrender.com'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role === 'responsavel') {
      return NextResponse.redirect(`${BASE_URL}/responsavel/dashboard`)
    }
    return NextResponse.redirect(`${BASE_URL}/aluno/painel`)
  }

  return NextResponse.redirect(`${BASE_URL}/auth/login`)
}
