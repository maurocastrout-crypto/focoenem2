'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function QuestoesPage() {
  const [questoes, setQuestoes] = useState<any[]>([])
  const [atual, setAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [tempos, setTempos] = useState<Record<number, number>>({})
  const [inicioQ, setInicioQ] = useState(Date.now())
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('questoes').select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      setQuestoes(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => { setInicioQ(Date.now()) }, [atual])

  function responder(opcao: string) {
    const tempo = Math.round((Date.now() - inicioQ) / 1000)
    setTempos(prev => ({ ...prev, [atual]: tempo }))
    setRespostas(prev => ({ ...prev, [atual]: opcao }))
  }

  async function finalizar() {
    if (Object.keys(respostas).length < questoes.length) return
    setEnviando(true)

    const { data: { user } } = await supabase.auth.getUser()
    const acertos = questoes.filter((q, i) => respostas[i] === q.resposta_correta).length
    const pct = Math.round((acertos / questoes.length) * 100)

    const respostasArr = questoes.map((q, i) => ({
      questao_id: q.id,
      resposta: respostas[i],
      resultado: respostas[i] === q.resposta_correta ? 'correta' : 'errada',
      tempo_segundos: tempos[i] || 0,
      topico: q.topico,
    }))

    const { data: prova } = await supabase.from('mini_provas').insert({
      aluno_id: user?.id,
      total_questoes: questoes.length,
      acertos,
      percentual_acerto: pct,
      respostas: respostasArr,
    }).select().single()

    setResultado({ acertos, pct, total: questoes.length })
    setConcluido(true)
    setEnviando(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (concluido && resultado) return (
    <div className="max-w-lg animate-fade-up">
      <div className="card text-center border-accent/20 mb-4">
        <div className="text-5xl mb-3">{resultado.pct >= 70 ? '🎉' : resultado.pct >= 50 ? '💪' : '📚'}</div>
        <div className="font-display text-4xl font-bold text-accent mb-1">{resultado.pct}%</div>
        <div className="text-muted text-sm">{resultado.acertos} de {resultado.total} questões corretas</div>
      </div>
      <button className="btn-primary w-full" onClick={() => router.push('/aluno/painel')}>
        Voltar ao painel →
      </button>
    </div>
  )

  const q = questoes[atual]
  if (!q) return null
  const opcoes = ['A', 'B', 'C', 'D', 'E']

  return (
    <div className="max-w-2xl animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">Mini-prova 🎯</h1>
          <p className="text-muted text-xs mt-0.5">{q.area} · {q.topico}</p>
        </div>
        <div className="text-sm text-muted">
          Questão <span className="text-white font-bold">{atual + 1}</span> de {questoes.length}
        </div>
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full mb-6">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${((atual + 1) / questoes.length) * 100}%` }} />
      </div>

      <div className="card mb-4">
        <p className="text-sm leading-relaxed">{q.enunciado}</p>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {opcoes.map(op => {
          const val = q[`opcao_${op.toLowerCase()}`]
          if (!val) return null
          const selecionada = respostas[atual] === op
          return (
            <button
              key={op}
              onClick={() => responder(op)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left text-sm transition-all ${
                selecionada
                  ? 'bg-accent/10 border-accent text-white'
                  : 'bg-white/3 border-white/8 text-muted hover:border-white/20 hover:text-white'
              }`}
            >
              <span className={`font-bold shrink-0 ${selecionada ? 'text-accent' : 'text-muted'}`}>{op}</span>
              <span>{val}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        {atual > 0 && (
          <button className="btn-secondary flex-1" onClick={() => setAtual(a => a - 1)}>← Anterior</button>
        )}
        {atual < questoes.length - 1 ? (
          <button
            className="btn-primary flex-1"
            onClick={() => setAtual(a => a + 1)}
            disabled={!respostas[atual]}
          >
            Próxima →
          </button>
        ) : (
          <button
            className="btn-primary flex-1"
            onClick={finalizar}
            disabled={Object.keys(respostas).length < questoes.length || enviando}
          >
            {enviando ? 'Enviando...' : 'Finalizar prova →'}
          </button>
        )}
      </div>
    </div>
  )
}
