const http = require('http');

// POST /api/chat
async function chat(req, res) {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const systemPrompt = `You are Kubera AI, a friendly and concise investment assistant for the Kubera micro-investment app. 
You help users understand their portfolio (Gold, ETF, Index Funds, Debt Funds), explain round-up savings, and give simple investment tips.
Keep responses SHORT (2-3 sentences max). Be encouraging and positive. Use ₹ for currency.
Do NOT give actual financial advice - always remind users this is for educational purposes only.`;

    const payload = JSON.stringify({
      model: 'qwen3.5:4b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: false
    });

    // Use native http to call Ollama (no external dependency needed)
    const ollamaReply = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 60000
      };

      const request = http.request(options, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              resolve(`Model error: ${parsed.error}`);
            } else {
              resolve(parsed.message?.content || 'Sorry, I could not generate a response.');
            }
          } catch {
            resolve('Sorry, I could not parse the response.');
          }
        });
      });

      request.on('error', (err) => reject(err));
      request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
      request.write(payload);
      request.end();
    });

    return res.json({ success: true, reply: ollamaReply });

  } catch (err) {
    // Fallback if Ollama is not running
    console.error('Ollama error:', err.message);
    return res.json({
      success: true,
      reply: "I'm currently offline. Please ensure Ollama is running locally. In the meantime, your investments in Gold, ETF, Index, and Debt funds are growing steadily! 📈"
    });
  }
}

module.exports = { chat };
