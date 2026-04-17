import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from './lib/supabase/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient()

  // Pega a sessão atual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Rotas públicas (login, cadastro)
  const publicRoutes = ['/auth/login', '/auth/cadastro']

  // Se não tiver sessão e tentar acessar rota protegida → manda pro login
  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Se já tiver sessão e tentar acessar login/cadastro → manda pro painel
  if (session && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/aluno/painel', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
