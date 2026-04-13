'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConfiguracoesPage() {
  const [responsavel, setResponsavel] = useState<any>(null)
  const [codigoConvite, setCodigoConvite] = useState('')
  const [metaHoras, setMetaHoras] = useState(3)
  const [horarioResumo, setHorarioResumo] = useState('20:00')
  const [telefone, setTelefone] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      setResponsavel(data)
      setMetaHoras(data?.meta_horas_dia ?? 3)
      setHorarioResumo(data?.horario_resumo ?? '20:00')
      setTelefone(data?.telefone ?? '')
    }
    load()
  }, [])

  async function vincularAluno() {
    if (!codigoConvite) return
    const { data: aluno } = await supabase
      .from('users').select('id').eq('codigo_convite', codigoConvite).eq('role', 'aluno').single()
    if (!aluno) { alert('Código inválido'); return }
    await supabase.from('users').update({ aluno_id: aluno.id }).eq('id', responsavel.id)
    await supabase.from('users').update({ responsavel_id: responsavel.id }).eq('id', aluno.id)
    alert('Aluno vinculado com sucesso!')
    setCodigoConvite('')
  }

  async function salvar() {
    setLoading(true)
    await supabase.from('users').update({ meta_horas_dia: metaHoras, horario_resumo: horarioResumo, telefone }).eq('id', responsavel.id)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
    setLoading(false)
  }

  return (
    <div className="max-w-lg animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Configurações ⚙️</h1>
        <p className="text-muted text-sm mt-1">Personalize o acompanhamento do seu filho</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card">
          <div className="text-xs text-muted uppercase tracking-wide mb-4 font-medium">Vincular aluno</div>
          {responsavel?.aluno_id ? (
            <div className="flex items-center gap-2 text-sm text-accent">
              <span>✓</span> Aluno vinculado
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                className="input-base flex-1"
                placeholder="Código de convite do aluno"
                value={codigoConvite}
                onChange={e => setCodigoConvite(e.target.value)}
              />
              <button className="btn-primary px-4" onClick={vincularAluno}>Vincular</button>
            </div>
          )}
        </div>

        <div className="card flex flex-col gap-4">
          <div className="text-xs text-muted uppercase tracking-wide font-medium">Preferências</div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Meta diária de estudo: {metaHoras}h
            </label>
            <input type="range" min={1} max={8} value={metaHoras} onChange={e => setMetaHoras(+e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Horário do resumo no WhatsApp</label>
            <input className="input-base" type="time" value={horarioResumo} onChange={e => setHorarioResumo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Telefone WhatsApp (com DDD)</label>
            <input className="input-base" type="tel" placeholder="5585999999999" value={telefone} onChange={e => setTelefone(e.target.value)} />
          </div>
          <button className="btn-primary w-full" onClick={salvar} disabled={loading}>
            {salvo ? '✓ Salvo!' : loading ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </div>
  )
}
