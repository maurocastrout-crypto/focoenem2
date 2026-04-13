'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HistoricoPage() {
  const [sessoes, setSessoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('sessoes').select('*, mini_provas(*)')
        .eq('aluno_id', user.id)
        .order('inicio', { ascending: false })
        .limit(50)
      setSessoes(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Histórico 📋</h1>
        <p className="text-muted text-sm mt-1">Todas as suas sessões de estudo</p>
      </div>

      {sessoes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-muted">Nenhuma sessão ainda. Comece a estudar!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessoes.map((s, i) => {
            const min = Math.floor((s.duracao_segundos || 0) / 60)
            const prova = s.mini_provas?.[0]
            const data = new Date(s.inicio).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
            return (
              <div key={i} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{s.topico}</div>
                    <div className="text-xs text-muted mt-0.5">{s.area} · {data}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{min}min</span>
                    <span className={s.status === 'valida' ? 'badge-accent' : 'badge-warn'}>
                      {s.status === 'valida' ? 'válida' : s.status}
                    </span>
                  </div>
                </div>
                {prova && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3 text-xs text-muted">
                    <span>Mini-prova:</span>
                    <span className={prova.percentual_acerto >= 70 ? 'text-accent font-bold' : prova.percentual_acerto >= 50 ? 'text-warn font-bold' : 'text-danger font-bold'}>
                      {prova.percentual_acerto}% ({prova.acertos}/{prova.total_questoes})
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
