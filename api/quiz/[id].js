export default async function handler(request, response) {
  console.log('Quiz API function called:', { method: request.method, url: request.url, query: request.query });
  
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    response.status(200).end();
    return;
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    console.log('Method not allowed:', request.method);
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = request.query;
  console.log('Quiz ID from query:', id);

  if (!id || typeof id !== 'string') {
    console.log('Invalid quiz ID');
    return response.status(400).json({ error: 'Quiz ID is required' });
  }

  try {
    console.log(`Attempting to fetch quiz: ${id}`);
    
    // Use the working Quizizz API endpoint
    const testUrl = `https://quizizz.com/_quizserver/main/v2/quiz/${id}?convertQuestions=false&includeFsFeatures=true&sanitize=read&questionMetadata=true&userRegion=CA&includeUserHydratedVariants=true`;
    console.log('Making request to:', testUrl);
    
    // Make request to Quizizz API
    const quizizzResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://quizizz.com/',
        'Origin': 'https://quizizz.com',
      },
    });

    console.log('Response status:', quizizzResponse.status);
    console.log('Response headers:', Object.fromEntries(quizizzResponse.headers.entries()));

    if (!quizizzResponse.ok) {
      const errorText = await quizizzResponse.text();
      console.error(`Quizizz API error: ${quizizzResponse.status} ${quizizzResponse.statusText}`, errorText);
      
      if (quizizzResponse.status === 404) {
        return response.status(404).json({ error: 'Quiz not found', quizId: id });
      }
      throw new Error(`HTTP error! status: ${quizizzResponse.status}, response: ${errorText}`);
    }

    const data = await quizizzResponse.json();
    console.log(`Successfully fetched quiz: ${id}, data keys:`, Object.keys(data));
    
    // Return the quiz data
    return response.status(200).json(data);

  } catch (error) {
    console.error('Error fetching quiz:', error);
    return response.status(500).json({ 
      error: 'Failed to fetch quiz data',
      details: error.message || 'Unknown error',
      quizId: id
    });
  }
} 