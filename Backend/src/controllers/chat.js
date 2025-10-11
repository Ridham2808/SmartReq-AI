import { chatWithAI } from '../utils/llm.js'

export const chatHandler = async (req, res) => {
  try {
    const { message, context = [] } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      })
    }

    const result = await chatWithAI(message, context)

    res.json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: result.response,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Chat handler error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process chat',
      error: error.message
    })
  }
}