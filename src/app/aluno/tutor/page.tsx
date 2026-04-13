'use client'

import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function TutorPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'Olá! Sou o Tutor IA do FocoENEM. Pode me perguntar qualquer coisa sobre as matérias do ENEM — Matemática, Português, Ciências, História, Geografia ou Redação. Como posso te ajudar hoje?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Msg = { role: 'user', content: input }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...msgs, userMsg] }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'assistant', content: data.resposta }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA. Tente novamente.' }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl animate-fade-up flex flex-col" style={{ height: 'calc(100vh - 96px)' }}>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold">Tutor IA 🤖</h1>
        <p className="text-muted text-sm mt-1">Tire dúvidas de qualquer matéria do ENEM</p>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 mb-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-accent/10 border border-accent/20 text-white'
                : 'bg-surface2 border border-white/8 text-white'
            }`}>
              {m.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-2 text-xs text-accent font-medium">
                  <span>🤖</span> Tutor IA
                </div>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface2 border border-white/8 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-3">
        <input
          className="input-base flex-1"
          placeholder="Pergunte sobre qualquer matéria do ENEM..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary px-5" disabled={loading || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}
