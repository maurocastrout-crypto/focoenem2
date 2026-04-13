'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RelatorioPage() {
  const [aluno, setAluno] = useState<any>(null)
  const [sessoes, setSessoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: resp } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (!resp?.aluno_id) { setLoading(false); return }

      const { data: al } = await supabase.from('users').select('*').eq('id', resp.aluno_id).single()
      setAluno(al)

      const mesPassado = new Date()
      mesPassado.setDate(1)
      const { data: sess } = await supabase
        .from('sessoes').select('*, mini_provas(*)')
        .eq('aluno_id', resp.aluno_id)
        .gte('inicio', mesPassado.toISOString())
        .order('inicio', { ascending: false })
      setSessoes(sess ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-6 h-6 border-2 border-accent2 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalTempo = sessoes.reduce((acc, s) => acc + (s.duracao_segundos || 0), 0)
  const hh = Math.floor(totalTempo / 3600)
  const provas = sessoes.map(s => s.mini_provas?.[0]).filter(Boolean)
  const acertoMedio = provas.length
    ? Math.round(provas.reduce((acc: number, p: any) => acc + p.percentual_acerto, 0) / provas.length)
    : 0

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Relatório do Mês 📈</h1>
        <p className="text-muted text-sm mt-1">Evolução de {aluno?.nome} nos últimos 30 dias</p>
      </div>

      {!aluno ? (
        <div className="card text-center py-12">
          <p className="text-muted">Nenhum aluno vinculado ainda.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: '⏱', label: 'Total estudado', val: `${hh}h`, cor: 'text-accent' },
              { icon: '📚', label: 'Sessões', val: sessoes.length, cor: 'text-accent2' },
              { icon: '🎯', label: 'Acerto médio', val: `${acertoMedio}%`, cor: 'text-warn' },
            ].map((s, i) => (
              <div key={i} className="card text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-xs text-muted uppercase tracking-wide mb-1">{s.label}</div>
                <div className={`font-display text-2xl font-bold ${s.cor}`}>{s.val}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="text-xs text-muted uppercase tracking-wide mb-4 font-medium">Sessões do mês</div>
            {sessoes.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Nenhuma sessão este mês.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sessoes.slice(0, 15).map((s, i) => {
                  const min = Math.floor((s.duracao_segundos || 0) / 60)
                  const data = new Date(s.inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  const prova = s.mini_provas?.[0]
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                      <div>
                        <span className="font-medium">{s.topico}</span>
                        <span className="text-xs text-muted ml-2">{s.area}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span>{min}min</span>
                        {prova && <span className={prova.percentual_acerto >= 70 ? 'text-accent' : 'text-warn'}>{prova.percentual_acerto}%</span>}
                        <span>{data}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
