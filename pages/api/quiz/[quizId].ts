import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { QuizizzResponse } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuizizzResponse | { error: string }>
) {
  const { quizId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!quizId || typeof quizId !== 'string') {
    return res.status(400).json({ error: 'Quiz ID is required' });
  }

  try {
    console.log(`Attempting to fetch quiz data for ID: ${quizId}`);
    
    // Call Quizizz API directly with the working endpoint
    const apiUrl = `https://quizizz.com/_quizserver/main/v2/quiz/${quizId}?convertQuestions=false&includeFsFeatures=true&sanitize=read&questionMetadata=true&userRegion=CA&includeUserHydratedVariants=true`;
    
    const response = await axios.get<any>(apiUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://quizizz.com/',
        'Origin': 'https://quizizz.com',
      }
    });
    
    if (response.data?.data?.quiz) {
      const quiz = response.data.data.quiz;
      const transformedData: QuizizzResponse = {
        data: {
          quiz: {
            _id: quiz._id,
            info: {
              name: quiz.info.name,
              image: quiz.info.image || undefined,
              questions: quiz.info.questions.map((q: any) => ({
                _id: q._id,
                type: q.type || 'MCQ',
                structure: {
                  query: {
                    text: q.structure.query.text || '',
                    media: q.structure.query.media || []
                  },
                  options: q.structure.options.map((opt: any) => ({
                    text: opt.text || '',
                    media: opt.media || []
                  })),
                  answer: Array.isArray(q.structure.answer) ? q.structure.answer : [Number(q.structure.answer)],
                  explain: q.structure.explain || { text: 'No explanation provided' }
                }
              }))
            }
          }
        }
      };
      
      return res.status(200).json(transformedData);
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (err) {
    console.error('Error fetching from API:', err);
    const errorMessage = `Failed to fetch quiz ${quizId}: ${err instanceof Error ? err.message : 'Unknown error'}`;
    return res.status(500).json({ error: errorMessage });
  }
} 