'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const AREAS = ['Matemática', 'Linguagens', 'Ciências da Natureza', 'Ciências Humanas', 'Redação']

export default function SessaoPage() {
  const [sessaoAtiva, setSessaoAtiva] = useState<any>(null)
  const [area, setArea] = useState(AREAS[0])
  const [topico, setTopico] = useState('')
  const [segundos, setSegundos] = useState(0)
  const [pausada, setPausada] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const timerRef = useRef<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))
  }, [])

  useEffect(() => {
    if (sessaoAtiva && !pausada) {
      timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [sessaoAtiva, pausada])

  function pad(n: number) { return String(n).padStart(2, '0') }
  function fmt(s: number) {
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
  }

  async function iniciar() {
    if (!user || !topico) return
    setLoading(true)
    const { data } = await supabase.from('sessoes').insert({
      aluno_id: user.id,
      area,
      topico,
      status: 'em_andamento',
      inicio: new Date().toISOString(),
    }).select().single()
    setSessaoAtiva(data)
    setSegundos(0)
    setLoading(false)
  }

  async function pausar() {
    if (!sessaoAtiva) return
    const novoStatus = pausada ? 'em_andamento' : 'pausada'
    await supabase.from('sessoes').update({ status: novoStatus }).eq('id', sessaoAtiva.id)
    setPausada(!pausada)
  }

  async function finalizar() {
    if (!sessaoAtiva) return
    setLoading(true)
    await supabase.from('sessoes').update({
      status: 'valida',
      fim: new Date().toISOString(),
      duracao_segundos: segundos,
    }).eq('id', sessaoAtiva.id)
    setSessaoAtiva(null)
    setSegundos(0)
    setPausada(false)
    setLoading(false)
    router.push('/aluno/questoes?sessao=' + sessaoAtiva.id)
  }

  return (
    <div className="max-w-lg animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Sessão de Estudo ⏱</h1>
        <p className="text-muted text-sm mt-1">Cronometrando seu tempo de foco</p>
      </div>

      {!sessaoAtiva ? (
        <div className="card flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Área</label>
            <select className="input-base" value={area} onChange={e => setArea(e.target.value)}>
              {AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Tópico específico</label>
            <input
              className="input-base"
              placeholder="Ex: Funções quadráticas, Revolução Francesa..."
              value={topico}
              onChange={e => setTopico(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full mt-2" onClick={iniciar} disabled={loading || !topico}>
            {loading ? 'Iniciando...' : '▶ Iniciar sessão'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="card text-center border-accent/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${pausada ? 'bg-warn' : 'bg-accent animate-pulse-dot'}`} />
              <span className="text-xs font-medium text-muted uppercase tracking-wide">
                {pausada ? 'Pausada' : 'Em andamento'}
              </span>
            </div>
            <div className="font-display text-6xl font-bold text-accent mb-3 tracking-tight">
              {fmt(segundos)}
            </div>
            <div className="text-sm text-muted">{area} · {sessaoAtiva.topico}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary py-3" onClick={pausar}>
              {pausada ? '▶ Continuar' : '⏸ Pausar'}
            </button>
            <button className="btn-primary py-3" onClick={finalizar} disabled={loading}>
              {loading ? 'Finalizando...' : '⏹ Finalizar'}
            </button>
          </div>

          <div className="card text-xs text-muted text-center">
            Ao finalizar, você será direcionado para uma mini-prova sobre o conteúdo estudado.
          </div>
        </div>
      )}
    </div>
  )
}
