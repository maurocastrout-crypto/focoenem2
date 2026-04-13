import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const system = `Você é o Tutor IA do FocoENEM, especialista em todas as matérias do ENEM. 
Responda sempre em português brasileiro de forma clara, didática e motivadora.
Use exemplos práticos. Seja conciso mas completo. Quando relevante, mencione como o tema cai no ENEM.
Matérias: Matemática, Língua Portuguesa, Literatura, Redação, Biologia, Química, Física, História, Geografia, Filosofia, Sociologia, Inglês.`

  const contents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
      }),
    }
  )

  const data = await res.json()
  const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Erro ao processar resposta.'

  return NextResponse.json({ resposta })
}
