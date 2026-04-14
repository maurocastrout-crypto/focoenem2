'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<'aluno' | 'responsavel'>('aluno')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: `https://focoenem2.onrender.com/auth/login` }
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        nome,
        sobrenome,
        role,
      })
    }

    setSucesso(true)
    setLoading(false)
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="font-display text-2xl font-bold mb-2">Confirme seu e-mail</h2>
          <p className="text-muted text-sm mb-6">
            Enviamos um link de confirmação para <strong className="text-white">{email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <Link href="/auth/login" className="btn-primary inline-block">
            Ir para o login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_#00e5a0]" />
          <span className="font-display font-bold text-xl tracking-tight">FocoENEM</span>
        </div>

        <div className="card">
          <h1 className="font-display text-2xl font-bold mb-1">Criar conta</h1>
          <p className="text-muted text-sm mb-6">Comece a estudar com inteligência</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {(['aluno', 'responsavel'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-white/5 border-white/10 text-muted hover:border-white/20'
                }`}
              >
                {r === 'aluno' ? '🎓 Sou aluno' : '👨‍👩‍👦 Sou responsável'}
              </button>
            ))}
          </div>

          <form onSubmit={handleCadastro} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Nome</label>
                <input className="input-base" type="text" name="nome" placeholder="João" value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Sobrenome</label>
                <input className="input-base" type="text" name="sobrenome" placeholder="Silva" value={sobrenome} onChange={e => setSobrenome(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">E-mail</label>
              <input className="input-base" type="email" name="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Senha</label>
              <input className="input-base" type="password" name="senha" placeholder="Mínimo 8 caracteres" minLength={8} value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>

            {erro && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{erro}</div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta →'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-accent hover:underline font-medium">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
