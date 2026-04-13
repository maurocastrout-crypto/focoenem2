'use client'

import { useState } from 'react'

type Resultado = {
  nota_total: number
  competencias: { nome: string; nota: number; feedback: string }[]
  feedback_geral: string
}

export default function RedacaoPage() {
  const [tema, setTema] = useState('')
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState('')

  async function handleCorrigir(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    setResultado(null)

    try {
      const res = await fetch('/api/redacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, texto }),
      })
      const data = await res.json()
      if (data.erro) { setErro(data.erro); setLoading(false); return }
      setResultado(data)
    } catch {
      setErro('Erro ao corrigir. Tente novamente.')
    }
    setLoading(false)
  }

  const cores = [
    (n: number) => n >= 160 ? 'text-accent' : n >= 100 ? 'text-warn' : 'text-danger'
  ]

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Correção de Redação ✍️</h1>
        <p className="text-muted text-sm mt-1">A IA corrige sua redação nas 5 competências do ENEM</p>
      </div>

      {!resultado ? (
        <form onSubmit={handleCorrigir} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Tema da redação</label>
            <input
              className="input-base"
              placeholder="Ex: A importância da educação digital no Brasil"
              value={tema}
              onChange={e => setTema(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Texto da redação
              <span className="ml-2 text-muted normal-case font-normal">({texto.length} caracteres)</span>
            </label>
            <textarea
              className="input-base resize-none"
              placeholder="Cole ou escreva sua redação aqui... (mínimo 200 caracteres)"
              rows={14}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              required
              minLength={200}
            />
          </div>

          {erro && <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{erro}</div>}

          <button type="submit" className="btn-primary w-full" disabled={loading || texto.length < 200}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin" />
                Corrigindo com IA...
              </span>
            ) : 'Corrigir redação →'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="card border-accent/20 text-center">
            <div className="text-muted text-sm mb-1">Nota final</div>
            <div className={`font-display text-5xl font-bold ${resultado.nota_total >= 700 ? 'text-accent' : resultado.nota_total >= 500 ? 'text-warn' : 'text-danger'}`}>
              {resultado.nota_total}
            </div>
            <div className="text-muted text-sm mt-1">de 1000 pontos</div>
          </div>

          <div className="card">
            <div className="text-xs text-muted uppercase tracking-wide mb-4 font-medium">Competências</div>
            <div className="flex flex-col gap-4">
              {resultado.competencias.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.nome}</span>
                    <span className={`font-display font-bold ${c.nota >= 160 ? 'text-accent' : c.nota >= 100 ? 'text-warn' : 'text-danger'}`}>
                      {c.nota}/200
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(c.nota / 200) * 100}%`,
                        background: c.nota >= 160 ? '#00e5a0' : c.nota >= 100 ? '#f59e0b' : '#ff4d6d'
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{c.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-accent2/20">
            <div className="text-xs text-muted uppercase tracking-wide mb-3 font-medium">Feedback geral da IA</div>
            <p className="text-sm leading-relaxed">{resultado.feedback_geral}</p>
          </div>

          <button onClick={() => { setResultado(null); setTexto(''); setTema('') }} className="btn-secondary w-full">
            Corrigir outra redação
          </button>
        </div>
      )}
    </div>
  )
}
