import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isLoginPage = path === '/auth/login'
  const isCadastroPage = path === '/auth/cadastro'
  const isCallback = path === '/auth/callback'
  const isAluno = path.startsWith('/aluno')
  const isResponsavel = path.startsWith('/responsavel')
  const isApi = path.startsWith('/api')

  // Nunca bloqueia API nem callback
  if (isApi || isCallback) return supabaseResponse

  // Sem sessão tentando acessar área protegida → login
  if (!user && (isAluno || isResponsavel)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Já logado tentando acessar login ou cadastro → redireciona para painel
  if (user && (isLoginPage || isCadastroPage)) {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role === 'responsavel') {
      return NextResponse.redirect(new URL('/responsavel/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/aluno/painel', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
