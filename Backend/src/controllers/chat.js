const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/env');

// Minimal OpenAI proxy using fetch to avoid extra deps; respects OPENAI_API_KEY
async function callOpenAI(messages, { model = (process.env.OPENAI_MODEL || 'gpt-4o-mini'), temperature = 0.2, max_tokens = 400 } = {}) {
  const apiKey = config.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// POST /api/chat
// body: { prompt: string, context?: object }
const chatHandler = asyncHandler(async (req, res) => {
  const { prompt, context } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, message: 'prompt is required' });
  }

  // System and user prompts to keep responses concise and helpful for UI
  const system = 'You are a helpful assistant for SmartReq AI. Keep answers concise, structured, and helpful for building flows and user stories.';
  const user = context ? `${prompt}\n\nContext:\n${JSON.stringify(context)}` : prompt;

  try {
    const content = await callOpenAI([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]);
    return res.json({ success: true, data: { reply: content } });
  } catch (e) {
    // Fast fallback when OpenAI is not configured or errors out
    const fallback = `Fast mode reply (no external AI):\n- You asked: "${prompt.slice(0, 300)}"\n- Suggestion: Click Generate AI Flow for an auto graph.\n- Tip: Be specific about actors, decisions, and success criteria.`;
    return res.json({ success: true, data: { reply: fallback, mode: 'fast' } });
  }
});

module.exports = { chatHandler };


