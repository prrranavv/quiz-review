import axios from 'axios';
import { QuizizzResponse } from '../types';

export const fetchQuizData = async (quizId: string): Promise<QuizizzResponse> => {
  if (!quizId) {
    throw new Error('Quiz ID is required');
  }
  
  try {
    console.log(`Attempting to fetch quiz data for ID: ${quizId}`);
    
    // Use our serverless function proxy instead of calling Quizizz directly
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isDevelopment
      ? `http://localhost:3000/api/quiz/${quizId}`
      : `/api/quiz/${quizId}`;
    
    const response = await axios.get<any>(apiUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
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