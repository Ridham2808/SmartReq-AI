const fs = require('fs')
const path = require('path')

// Best-effort optional imports; fallback gracefully if not installed
let pdfParse = null
try { pdfParse = require('pdf-parse') } catch (_) {}

function stripPII(text) {
  if (!text) return ''
  return String(text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b\+?\d[\d\-()\s]{6,}\b/g, '[redacted-phone]')
}

async function extractTextFromFile(filePath) {
  if (!filePath) return ''
  const ext = path.extname(filePath).toLowerCase()
  try {
    if (ext === '.pdf' && pdfParse) {
      const data = await pdfParse(fs.readFileSync(filePath))
      return data.text || ''
    }
    // Fallback: read raw text for .txt, naive for others
    return fs.readFileSync(filePath, 'utf8')
  } catch (_) {
    return ''
  }
}

function chunkText(text, tokensPerChunk = 500) {
  const words = String(text).split(/\s+/)
  const chunks = []
  let current = []
  let count = 0
  for (const w of words) {
    current.push(w)
    count += 1
    if (count >= tokensPerChunk) {
      chunks.push(current.join(' '))
      current = []
      count = 0
    }
  }
  if (current.length) chunks.push(current.join(' '))
  return chunks
}

async function buildCombinedTextFromInputs(inputs) {
  // For voice: assume content is already transcribed
  // For docs: extract from filePath if content missing
  const parts = []
  for (const input of inputs) {
    if (input.content && input.content.trim()) {
      parts.push(input.content)
      continue
    }
    if (input.filePath) {
      const txt = await extractTextFromFile(input.filePath)
      if (txt) parts.push(txt)
    }
  }
  return stripPII(parts.join('\n\n'))
}

module.exports = {
  stripPII,
  chunkText,
  buildCombinedTextFromInputs,
}


