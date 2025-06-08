import axios from 'axios';
import { QuizizzResponse } from '../types';

export const fetchQuizData = async (quizId: string): Promise<QuizizzResponse> => {
  if (!quizId) {
    throw new Error('Quiz ID is required');
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
      
      return transformedData;
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (err) {
    console.error('Error fetching from API:', err);
    throw new Error(`Failed to fetch quiz ${quizId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}; 