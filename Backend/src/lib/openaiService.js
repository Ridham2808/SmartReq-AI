import crypto from 'crypto'
import PQueue from 'p-queue'
import { config } from '../config/env.js'

// Lightweight in-memory cache; swap with Redis if available
const cache = new Map()
const queue = new PQueue({ concurrency: 3, intervalCap: 50, interval: 60000 })

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

async function callOpenAIJSON(systemPrompt, userText) {
  const apiKey = config.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  const model = process.env.OPENAI_MODEL || 'gpt-4o'
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ],
    max_tokens: 3000,
    temperature: 0.2,
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`)
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content || ''
  // Basic token logging if available
  if (json.usage?.total_tokens) {
    console.warn(`Tokens used: ${json.usage.total_tokens}`)
  }
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('LLM did not return JSON')
  return JSON.parse(content.slice(start, end + 1))
}

function isDeepFlow(result) {
  try {
    const nodes = result?.flow?.nodes || []
    const edges = result?.flow?.edges || []
    if (nodes.length < 10 || edges.length < 9) return false
    const decisions = nodes.filter(n => (n.type === 'decision' || n.data?.type === 'decision')).length
    if (decisions < 3) return false
    const loopEdges = edges.filter(e => e.animated || /loop/i.test(e.label || '')).length
    if (loopEdges < 1) return false
    return true
  } catch (_) { return false }
}

async function generateArtifacts({ projectId, combinedText, projectType }) {
  const key = `generate:${projectId}:${hash(combinedText)}`
  if (cache.has(key)) return cache.get(key)

  let systemPrompt = `You are a fintech business analyst. Based on this specific user input, deeply analyze requirements (identify roles, actions, conditions, edge cases).\nGenerate 5-10 precise Gherkin user stories (full Given-When-Then). Then, build a comprehensive process flow JSON with 10-20 nodes, at least 3 decision nodes, at least 1 loop, and explicit error branches. Every node must be grounded in the input semantics (no generic login flows unless present). Include sub-process groups when appropriate. Color-code nodes: green for actions/success, yellow for decisions, red for errors. Auto-position with simple x/y increments (the frontend will re-layout). Output ONLY valid JSON: {"stories":[string],"flow":{"nodes":[{"id":string,"label":string,"type":"start"|"action"|"decision"|"end"|"loop","data":{"description":string,"icon"?:string,"type"?:string},"position":{"x":number,"y":number},"style"?:{"background"?:string}}],"edges":[{"id":string,"source":string,"target":string,"label"?:string,"type":"smoothstep","animated"?:boolean,"style"?:{"stroke"?:string}}]},"confidence":number}.\nDomain focus: ${projectType || 'fintech'} (add security/compliance/fraud steps if relevant).`

  // Try up to 3 attempts with tightening prompts if shallow
  let result = null
  let lastErr = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const candidate = await queue.add(() => callOpenAIJSON(systemPrompt, combinedText))
      if (isDeepFlow(candidate)) {
        result = candidate
        break
      }
      // tighten prompt and retry
      systemPrompt += `\nEnsure depth: nodes >= 10, decisions >= 3, include a retry loop and explicit error branches. Ground all steps in the provided input.`
      result = candidate
    } catch (e) {
      lastErr = e
      systemPrompt += `\nReturn STRICT JSON only; fix any JSON errors.`
    }
  }
  if (!result && lastErr) throw lastErr
  cache.set(key, result)
  setTimeout(() => cache.delete(key), 60 * 60 * 1000)
  return result
}

export { generateArtifacts }
