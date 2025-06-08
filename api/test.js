export default function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  return response.status(200).json({ 
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });
} 