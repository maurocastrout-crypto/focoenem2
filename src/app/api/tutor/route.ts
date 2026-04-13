import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `Você é o Tutor IA do FocoENEM, especialista em todas as matérias do ENEM. 
Responda sempre em português brasileiro de forma clara, didática e motivadora.
Use exemplos práticos. Seja conciso mas completo. Quando relevante, mencione como o tema cai no ENEM.
Matérias: Matemática, Língua Portuguesa, Literatura, Redação, Biologia, Química, Física, História, Geografia, Filosofia, Sociologia, Inglês.`,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    }),
  })

  const data = await res.json()
  const resposta = data.content?.[0]?.text ?? 'Erro ao processar resposta.'

  return NextResponse.json({ resposta })
}
