export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();

    // Si el modelo no tiene "/" es Anthropic directo (ej: "claude-sonnet-4-5")
    // Si tiene "/" es OpenRouter (ej: "anthropic/claude-sonnet-4-5")
    const isAnthropic = body.model && !body.model.includes('/');

    if (isAnthropic) {
      const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
      if (!ANTHROPIC_KEY) {
        return new Response(JSON.stringify({ error: 'Anthropic key not configured' }), { status: 500 });
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });

    } else {
      const OR_KEY = process.env.OR_KEY;
      if (!OR_KEY) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
      }
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + OR_KEY,
          'HTTP-Referer': 'https://cacamatch.vercel.app',
          'X-Title': 'CacaMatch'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
