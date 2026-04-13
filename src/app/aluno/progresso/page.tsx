'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AREAS = [
  { key: 'matematica', label: 'Matemática', cor: '#00e5a0' },
  { key: 'linguagens', label: 'Linguagens', cor: '#7F77DD' },
  { key: 'natureza', label: 'Ciências da Natureza', cor: '#378ADD' },
  { key: 'humanas', label: 'Ciências Humanas', cor: '#f59e0b' },
  { key: 'redacao', label: 'Redação', cor: '#D85A30' },
]

export default function ProgressoPage() {
  const [progresso, setProgresso] = useState<any>(null)
  const [areas, setAreas] = useState<any[]>([])
  const [sessoes, setSessoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prog }, { data: ar }, { data: sess }] = await Promise.all([
        supabase.from('progresso_geral').select('*').eq('aluno_id', user.id).single(),
        supabase.from('progresso_areas').select('*').eq('aluno_id', user.id),
        supabase.from('sessoes').select('*').eq('aluno_id', user.id).order('inicio', { ascending: false }).limit(30),
      ])

      setProgresso(prog)
      setAreas(ar ?? [])
      setSessoes(sess ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalTempo = sessoes.reduce((acc, s) => acc + (s.duracao_segundos || 0), 0)
  const hh = Math.floor(totalTempo / 3600)
  const totalSessoes = sessoes.length

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Meu Progresso 📊</h1>
        <p className="text-muted text-sm mt-1">Acompanhe sua evolução no ENEM</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: '🔥', label: 'Streak atual', val: `${progresso?.streak_atual ?? 0} dias`, cor: 'text-warn' },
          { icon: '⏱', label: 'Total estudado', val: `${hh}h`, cor: 'text-accent' },
          { icon: '📚', label: 'Total de sessões', val: totalSessoes, cor: 'text-accent2' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xs text-muted uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`font-display text-2xl font-bold ${s.cor}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div className="text-xs text-muted uppercase tracking-wide mb-4 font-medium">Progresso por área</div>
        <div className="flex flex-col gap-4">
          {AREAS.map(a => {
            const dado = areas.find(x => x.area === a.key)
            const pct = dado?.percentual ?? 0
            return (
              <div key={a.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{a.label}</span>
                  <span className="font-display font-bold text-sm" style={{ color: a.cor }}>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: a.cor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="text-xs text-muted uppercase tracking-wide mb-4 font-medium">Últimas sessões</div>
        {sessoes.slice(0, 8).length === 0 ? (
          <p className="text-sm text-muted text-center py-4">Nenhuma sessão ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessoes.slice(0, 8).map((s, i) => {
              const min = Math.floor((s.duracao_segundos || 0) / 60)
              const data = new Date(s.inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-sm font-medium">{s.topico}</span>
                    <span className="text-xs text-muted ml-2">{s.area}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{min}min</span>
                    <span>{data}</span>
                    <span className={s.status === 'valida' ? 'badge-accent' : 'badge-warn'}>
                      {s.status === 'valida' ? 'válida' : s.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
