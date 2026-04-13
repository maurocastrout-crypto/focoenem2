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

  const isAuth = path.startsWith('/auth')
  const isAluno = path.startsWith('/aluno')
  const isResponsavel = path.startsWith('/responsavel')
  const isApi = path.startsWith('/api')

  if (isApi) return supabaseResponse

  // Se não tem usuário e tenta acessar área protegida → login
  if (!user && (isAluno || isResponsavel)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Se tem usuário e tenta acessar /auth → redireciona para painel
  // Mas NÃO redireciona se vier de um redirect do próprio login
  if (user && isAuth) {
    const referer = request.headers.get('referer') || ''
    const comingFromLogin = referer.includes('/auth/login') || referer.includes('/auth/cadastro')
    
    // Se veio do login, deixa o window.location.href do cliente resolver
    // Se tentou acessar /auth diretamente já logado, redireciona
    if (!comingFromLogin) {
      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
      if (profile?.role === 'responsavel') {
        return NextResponse.redirect(new URL('/responsavel/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/aluno/painel', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
