const config = require('../config/env')

async function callOpenAI(prompt) {
  const apiKey = config.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  // Let OpenAI choose a suitable model server-side if not specified; fallback to a broadly available one
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  
  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
  
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2000 // Limit response size for faster generation
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) throw new Error(`OpenAI error ${res.status}`)
    const json = await res.json()
    return json.choices?.[0]?.message?.content || ''
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('OpenAI request timed out')
    }
    throw error
  }
}

async function callGemini(prompt) {
  const apiKey = config.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY missing')
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  
  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2000 // Limit response size for faster generation
        }
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) throw new Error(`Gemini error ${res.status}`)
    const json = await res.json()
    return json.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Gemini request timed out')
    }
    throw error
  }
}

async function generateArtifactsFromText(text) {
  const systemPrompt = `You are SmartReq AI. From the given requirements text, return STRICT JSON:
{
  "userStories": [{ "id": number, "content": string }],
  "flow": {
    "nodes": [{ "id": string, "type": "custom", "position": { "x": number, "y": number }, "data": { "label": string, "type": "start"|"process"|"end" }}],
    "edges": [{ "id": string, "source": string, "target": string, "type": "smoothstep" }]
  }
}
Rules:
- Generate 5-8 concise user stories
- Create 6-10 flow nodes with simple positions
- Keep JSON minimal for speed
- Return ONLY JSON, no other text.`
  const userPrompt = `TEXT:\n\n${text}\n\nReturn ONLY JSON.`
  const prompt = `${systemPrompt}\n\n${userPrompt}`

  let content = ''
  // Prefer OpenAI if available, fallback to Gemini
  if (config.OPENAI_API_KEY) {
    content = await callOpenAI(prompt)
  } else if (config.GEMINI_API_KEY) {
    content = await callGemini(prompt)
  } else {
    throw new Error('No LLM API keys available')
  }

  // Extract JSON safely
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('LLM did not return JSON')
  const jsonStr = content.slice(start, end + 1)
  return JSON.parse(jsonStr)
}

module.exports = { generateArtifactsFromText }


