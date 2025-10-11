import crypto from 'crypto'
import PQueue from 'p-queue'
import pRetry from 'p-retry'
import { config } from '../config/env.js'

// In-memory cache; recommended to replace with Redis in production
const cache = new Map()
const queue = new PQueue({ concurrency: 4 })

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function sanitizePII(text) {
  if (!text) return ''
  return String(text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b\+?\d[\d\-()\s]{6,}\b/g, '[redacted-phone]')
}

function buildSystemPrompt(projectType) {
  return `You are a ${projectType || 'business'} analyst. Produce compact, actionable outputs.
1) Generate 3-6 concise Gherkin user stories (Given-When-Then), grounded in the input.
2) Build a process flow JSON with 8-12 nodes total, at least 2 decision nodes, explicit success and error endings. Avoid loops/groups. Keep labels short.
3) Keep JSON minimal for speed.
Output ONLY strict JSON matching:
{"stories":[string],"flow":{"nodes":[{"id":string,"label":string,"type":"start"|"process"|"decision"|"end","position":{"x":number,"y":number}}],"edges":[{"id":string,"source":string,"target":string,"label"?:string}]},"confidence":number}`
}

function isDeepFlow(candidate) {
  try {
    const nodes = candidate?.flow?.nodes || []
    const edges = candidate?.flow?.edges || []
    if (nodes.length < 8 || edges.length < 7) return false
    const decisions = nodes.filter(n => n.type === 'decision').length
    if (decisions < 2) return false
    return true
  } catch (_) { return false }
}

function validateJsonShape(obj) {
  if (!obj || !Array.isArray(obj.stories) || !obj.flow) return false
  const { nodes = [], edges = [] } = obj.flow
  const nodeIds = new Set(nodes.map(n => n.id))
  if (nodes.length === 0 || edges.length === 0) return false
  return edges.every(e => nodeIds.has(e.source) && nodeIds.has(e.target))
}

async function callOpenAIStream({ system, user, model = (process.env.OPENAI_MODEL || 'gpt-4o-mini'), temperature = 0.1, max_tokens = 700 }) {
  const apiKey = config.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [ { role: 'system', content: system }, { role: 'user', content: user } ],
      temperature,
      max_tokens,
      stream: true
    })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI stream error ${res.status}: ${text}`)
  }
  return res
}

async function streamGenerate({ projectId, inputText, projectType, onDelta, onComplete }) {
  const cleaned = sanitizePII(inputText)
  const cacheKey = `flow:${projectId}:${hash(cleaned)}`
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)
    if (onDelta && cached.stories?.length) onDelta({ stories: cached.stories, partial: true })
    if (onComplete) onComplete(cached)
    return cached
  }

  const system = buildSystemPrompt(projectType)

  const execute = async () => {
    const response = await queue.add(() => callOpenAIStream({ system, user: cleaned }))
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let aggregatedText = ''
    // try to surface stories early
    let earlyStoriesSent = false

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      aggregatedText += chunk
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        if (!part.startsWith('data:')) continue
        const data = part.replace(/^data:\s*/, '').trim()
        if (data === '[DONE]') continue
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content || ''
          if (delta && onDelta) {
            // naive early story extraction: detect beginnings of stories array
            if (!earlyStoriesSent && /"stories"\s*:\s*\[/.test(aggregatedText)) {
              earlyStoriesSent = true
              onDelta({ stories: [], partial: true })
            }
          }
        } catch (_) {
          // ignore
        }
      }
    }

    // After stream end, extract the last JSON object
    const start = aggregatedText.lastIndexOf('{')
    const end = aggregatedText.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) throw new Error('Invalid streamed JSON')
    const textJson = aggregatedText.slice(start, end + 1)
    const result = JSON.parse(textJson)
    if (!validateJsonShape(result) || !isDeepFlow(result)) {
      throw new Error('Shallow or invalid JSON shape')
    }
    cache.set(cacheKey, result)
    setTimeout(() => cache.delete(cacheKey), 24 * 60 * 60 * 1000)
    if (onComplete) onComplete(result)
    return result
  }

  return pRetry(execute, {
    retries: 2,
    minTimeout: 500,
    maxTimeout: 2000,
    factor: 2,
    onFailedAttempt: (err) => {
      // Tighten prompt would happen at higher layer if needed
      if (config.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.warn(`OpenAI stream attempt ${err.attemptNumber} failed: ${err.message}`)
      }
    }
  })
}

export {
  streamGenerate,
  sanitizePII,
}
