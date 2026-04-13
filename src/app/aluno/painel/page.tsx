'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PainelAlunoPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ tempoHoje: 0, streak: 0, acertoMedio: 0, sessoesHoje: 0 })
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const { data: profile } = await supabase.from('users').select('*').eq('id', u.id).single()
      setUser(profile)

      const hoje = new Date().toISOString().split('T')[0]
      const { data: sessoes } = await supabase
        .from('sessoes').select('*, mini_provas(*)')
        .eq('aluno_id', u.id)
        .gte('inicio', `${hoje}T00:00:00`)

      const tempoHoje = sessoes?.reduce((acc, s) => acc + (s.duracao_segundos || 0), 0) ?? 0
      const provas = sessoes?.map(s => s.mini_provas?.[0]).filter(Boolean) ?? []
      const acertoMedio = provas.length
        ? Math.round(provas.reduce((acc: number, p: any) => acc + p.percentual_acerto, 0) / provas.length)
        : 0

      const { data: prog } = await supabase.from('progresso_geral').select('*').eq('aluno_id', u.id).single()

      setStats({
        tempoHoje,
        streak: prog?.streak_atual ?? 0,
        acertoMedio,
        sessoesHoje: sessoes?.length ?? 0,
      })

      const { data: diag } = await supabase
        .from('diagnosticos').select('*').eq('aluno_id', u.id)
        .order('created_at', { ascending: false }).limit(1).single()
      setDiagnostico(diag)

      setLoading(false)
    }
    load()
  }, [])

  const hh = Math.floor(stats.tempoHoje / 3600)
  const mm = Math.floor((stats.tempoHoje % 3600) / 60)
  const tempoStr = hh > 0 ? `${hh}h ${mm}m` : `${mm}m`

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-up max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Olá, {user?.nome} 👋</h1>
        <p className="text-muted text-sm mt-1">Pronto para mais um dia de estudos?</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '⏱', label: 'Tempo hoje', val: tempoStr || '0m', cor: 'text-accent' },
          { icon: '🔥', label: 'Streak', val: `${stats.streak} dias`, cor: 'text-warn' },
          { icon: '🎯', label: 'Acerto médio', val: `${stats.acertoMedio}%`, cor: 'text-accent2' },
          { icon: '📚', label: 'Sessões hoje', val: stats.sessoesHoje, cor: 'text-accent' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xs text-muted uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`font-display text-2xl font-bold ${s.cor}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/aluno/sessao" className="card border-accent/20 hover:border-accent/40 transition-all group cursor-pointer col-span-1">
          <div className="text-3xl mb-3">⚡</div>
          <div className="font-display font-bold text-lg mb-1 group-hover:text-accent transition-colors">Iniciar sessão</div>
          <div className="text-sm text-muted">Comece a cronometrar seus estudos agora</div>
        </Link>
        <Link href="/aluno/tutor" className="card border-accent2/20 hover:border-accent2/40 transition-all group cursor-pointer col-span-1">
          <div className="text-3xl mb-3">🤖</div>
          <div className="font-display font-bold text-lg mb-1 group-hover:text-accent2 transition-colors">Tutor IA</div>
          <div className="text-sm text-muted">Tire dúvidas com inteligência artificial 24h</div>
        </Link>
        <Link href="/aluno/redacao" className="card border-warn/20 hover:border-warn/40 transition-all group cursor-pointer col-span-1">
          <div className="text-3xl mb-3">✍️</div>
          <div className="font-display font-bold text-lg mb-1 group-hover:text-warn transition-colors">Correção de redação</div>
          <div className="text-sm text-muted">IA corrige nas 5 competências do ENEM</div>
        </Link>
      </div>

      {diagnostico && (
        <div className="card border-danger/20 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔍</span>
            <span className="font-display font-bold">Diagnóstico da IA</span>
            <span className="badge-danger">Atenção</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">{diagnostico.mensagem_aluno}</p>
          {diagnostico.areas_fracas && (
            <div className="flex flex-wrap gap-2 mt-3">
              {diagnostico.areas_fracas.map((a: string) => (
                <span key={a} className="badge-warn">{a}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
