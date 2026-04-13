import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { tema, texto } = await req.json()

  const prompt = `Você é um corretor especialista em redações do ENEM. Corrija a seguinte redação e retorne APENAS um JSON válido, sem markdown, sem texto adicional.

Tema: ${tema}

Redação:
${texto}

Retorne exatamente neste formato JSON:
{
  "nota_total": <número de 0 a 1000>,
  "competencias": [
    {"nome": "Competência 1 — Domínio da norma culta", "nota": <0-200>, "feedback": "<feedback específico>"},
    {"nome": "Competência 2 — Compreensão do tema", "nota": <0-200>, "feedback": "<feedback específico>"},
    {"nome": "Competência 3 — Seleção de argumentos", "nota": <0-200>, "feedback": "<feedback específico>"},
    {"nome": "Competência 4 — Coesão e coerência", "nota": <0-200>, "feedback": "<feedback específico>"},
    {"nome": "Competência 5 — Proposta de intervenção", "nota": <0-200>, "feedback": "<feedback específico>"}
  ],
  "feedback_geral": "<parágrafo com análise geral e principais pontos de melhoria>"
}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  )

  const data = await res.json()
  const texto_resposta = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  try {
    const resultado = JSON.parse(texto_resposta.replace(/```json|```/g, '').trim())
    return NextResponse.json(resultado)
  } catch {
    return NextResponse.json({ erro: 'Erro ao processar correção. Tente novamente.' })
  }
}
