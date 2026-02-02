const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://nik-collab-platform.com',
    'X-Title': 'Collaboration Platform',
  }
});

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { content, prompt, documentId } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Prompt is required' }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        }
      };
    }

    // Construct AI prompt with context
    const systemPrompt = `You are an AI assistant helping with collaborative document editing. 
Current document content: ${content || 'Empty document'}

User request: ${prompt}

Provide helpful, concise suggestions for improving or editing the document.`;

    const completion = await openai.chat.completions.create({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const suggestion = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        suggestion,
        documentId,
        model: 'mistralai/mistral-7b-instruct:free'
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      }
    };
  } catch (error) {
    console.error('AI Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to get AI suggestion',
        details: error.message 
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    };
  }
};
