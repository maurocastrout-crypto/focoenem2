'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setErro('E-mail ainda não confirmado. Verifique sua caixa de entrada.')
        } else {
          setErro('E-mail ou senha incorretos.')
        }
        return
      }

      // Agora, com o AuthProvider cuidando da sessão,
      // podemos redirecionar direto para o painel
      window.location.href = '/aluno/painel'
    } catch (err: any) {
      setErro('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_#00e5a0]" />
          <span className="font-display font-bold text-xl tracking-tight">FocoENEM</span>
        </div>

        <div className="card">
          <h1 className="font-display text-2xl font-bold mb-1">Bom ter você de volta</h1>
          <p className="text-muted text-sm mb-6">Entre na sua conta para continuar</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">E-mail</label>
              <input
                className="input-base"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Senha</label>
              <input
                className="input-base"
                type="password"
                name="senha"
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                {erro}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar na plataforma →'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Não tem conta?{' '}
            <Link href="/auth/cadastro" className="text-accent hover:underline font-medium">
              Criar conta
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 bg-accent/5 border border-accent/10 rounded-xl px-3 py-2.5 text-xs text-muted">
            <span>🔒</span>
            Seus dados estão protegidos com criptografia de ponta a ponta.
          </div>
        </div>
      </div>
    </div>
  )
}
