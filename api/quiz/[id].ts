import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = request.query;

  if (!id || typeof id !== 'string') {
    return response.status(400).json({ error: 'Quiz ID is required' });
  }

  try {
    // Make request to Quizizz API
    const quizizzResponse = await fetch(`https://quizizz.com/api/main/quiz/${id}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!quizizzResponse.ok) {
      if (quizizzResponse.status === 404) {
        return response.status(404).json({ error: 'Quiz not found' });
      }
      throw new Error(`HTTP error! status: ${quizizzResponse.status}`);
    }

    const data = await quizizzResponse.json();
    
    // Return the quiz data
    return response.status(200).json(data);

  } catch (error) {
    console.error('Error fetching quiz:', error);
    return response.status(500).json({ 
      error: 'Failed to fetch quiz data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 