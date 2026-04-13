'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardResponsavelPage() {
  const [responsavel, setResponsavel] = useState<any>(null)
  const [aluno, setAluno] = useState<any>(null)
  const [sessaoAtiva, setSessaoAtiva] = useState<any>(null)
  const [sessoesHoje, setSessoesHoje] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [guiaPais, setGuiaPais] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: resp } = await supabase.from('users').select('*').eq('id', user.id).single()
      setResponsavel(resp)

      if (!resp?.aluno_id) { setLoading(false); return }

      const alunoId = resp.aluno_id
      const { data: al } = await supabase.from('users').select('*').eq('id', alunoId).single()
      setAluno(al)

      const hoje = new Date().toISOString().split('T')[0]
      const { data: sess } = await supabase
        .from('sessoes').select('*, mini_provas(*)')
        .eq('aluno_id', alunoId)
        .gte('inicio', `${hoje}T00:00:00`)
        .order('inicio', { ascending: false })
      setSessoesHoje(sess ?? [])
      setSessaoAtiva(sess?.find(s => s.status === 'em_andamento' || s.status === 'pausada') ?? null)

      const { data: alt } = await supabase
        .from('alertas_sessao').select('*').eq('aluno_id', alunoId)
        .gte('timestamp', `${hoje}T00:00:00`).order('timestamp', { ascending: false })
      setAlertas(alt ?? [])

      const { data: diag } = await supabase
        .from('diagnosticos').select('*').eq('aluno_id', alunoId)
        .order('created_at', { ascending: false }).limit(1).single()
      setDiagnostico(diag)

      const { data: guia } = await supabase
        .from('guia_pais').select('*').eq('aluno_id', alunoId)
        .order('created_at', { ascending: false }).limit(1).single()
      setGuiaPais(guia)

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!sessaoAtiva) return
    const i = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(i)
  }, [sessaoAtiva])

  const tempoHoje = sessoesHoje.reduce((acc, s) => acc + (s.duracao_segundos || 0), 0)
  const hh = Math.floor(tempoHoje / 3600)
  const mm = Math.floor((tempoHoje % 3600) / 60)
  const tempoStr = hh > 0 ? `${hh}h ${mm}m` : `${mm}m`
  const provas = sessoesHoje.map(s => s.mini_provas?.[0]).filter(Boolean)
  const acertoMedio = provas.length
    ? Math.round(provas.reduce((acc: number, p: any) => acc + p.percentual_acerto, 0) / provas.length)
    : 0

  function pad(n: number) { return String(n).padStart(2, '0') }
  function fmt(s: number) { return `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}` }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-6 h-6 border-2 border-accent2 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!aluno) return (
    <div className="max-w-lg animate-fade-up text-center py-16">
      <div className="text-5xl mb-4">👨‍👩‍👦</div>
      <h2 className="font-display text-xl font-bold mb-2">Vincule uma conta de aluno</h2>
      <p className="text-muted text-sm">Vá em Configurações e insira o código do seu filho para conectar as contas.</p>
    </div>
  )

  return (
    <div className="animate-fade-up max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Olá, {responsavel?.nome} 👋</h1>
          <p className="text-muted text-sm mt-1">Acompanhando <strong className="text-white">{aluno.nome} {aluno.sobrenome}</strong></p>
        </div>
        {sessaoAtiva && (
          <div className="flex items-center gap-2 bg-accent/8 border border-accent/20 rounded-full px-4 py-2 text-sm font-semibold text-accent">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
            {aluno.nome} está estudando agora
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '⏱', label: 'Tempo hoje', val: tempoStr || '0m', cor: 'text-accent' },
          { icon: '🎯', label: 'Acerto médio', val: `${acertoMedio}%`, cor: 'text-accent2' },
          { icon: '📚', label: 'Sessões hoje', val: sessoesHoje.length, cor: 'text-accent' },
          { icon: '⚠️', label: 'Alertas hoje', val: alertas.length, cor: alertas.length > 0 ? 'text-danger' : 'text-muted' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xs text-muted uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`font-display text-2xl font-bold ${s.cor}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {sessaoAtiva && (
        <div className="card border-accent/20 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">📡 Ao Vivo</div>
            <div className="font-display text-xl font-bold text-accent">{fmt(timer)}</div>
          </div>
          <div className="text-sm text-muted">
            Estudando <strong className="text-white">{sessaoAtiva.topico}</strong> · {sessaoAtiva.area}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {diagnostico && (
          <div className="card border-danger/15">
            <div className="text-xs text-muted uppercase tracking-wide mb-3 font-medium">🔍 Diagnóstico IA</div>
            <p className="text-sm leading-relaxed text-muted">{diagnostico.mensagem_responsavel}</p>
            {diagnostico.areas_fracas?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {diagnostico.areas_fracas.map((a: string) => (
                  <span key={a} className="badge-danger">{a}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {guiaPais && (
          <div className="card border-accent2/15">
            <div className="text-xs text-muted uppercase tracking-wide mb-3 font-medium">💬 O que dizer ao seu filho</div>
            <p className="text-sm leading-relaxed text-muted">{guiaPais.mensagem}</p>
            {guiaPais.elogiar && (
              <div className="mt-3 p-3 bg-accent/5 border border-accent/10 rounded-xl">
                <div className="text-xs text-accent font-medium mb-1">👏 Elogie isso:</div>
                <p className="text-xs text-muted">{guiaPais.elogiar}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {alertas.length > 0 && (
        <div className="card border-warn/15">
          <div className="text-xs text-muted uppercase tracking-wide mb-3 font-medium">⚠️ Alertas de hoje</div>
          <div className="flex flex-col gap-2">
            {alertas.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-white/5 last:border-0">
                <span className="text-warn">⚠</span>
                <span className="text-muted">{a.descricao || a.tipo}</span>
                <span className="text-xs text-muted ml-auto">
                  {new Date(a.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
