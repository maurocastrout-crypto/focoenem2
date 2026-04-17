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

      // Redireciona direto para o painel
      window.location.href = '/aluno/painel'
    } catch (err: any) {
      setErro('Erro inesperado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4">
      <div className="w-full max-w-md animate-fade-up bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_15px_#00e5a0]" />
          <span className="font-display font-extrabold text-2xl tracking-tight text-indigo-700">
            FocoENEM
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold mb-2 text-center text-gray-800">
          Bom ter você de volta ✨
        </h1>
        <p className="text-muted text-sm mb-6 text-center">
          Entre na sua conta para continuar sua jornada
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">
              E-mail
            </label>
            <input
              className="input-base w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1.5">
              Senha
            </label>
            <input
              className="input-base w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
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
            <div className="text-sm text-danger bg-red-100 border border-red-300 rounded-xl px-4 py-3 text-red-700">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition-transform"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar na plataforma →'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Não tem conta?{' '}
          <Link href="/auth/cadastro" className="text-indigo-600 hover:underline font-medium">
            Criar conta
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 text-xs text-gray-600">
          <span>🔒</span>
          Seus dados estão protegidos com criptografia de ponta a ponta.
        </div>
      </div>
    </div>
  )
}
