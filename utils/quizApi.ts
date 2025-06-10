import axios from 'axios';
import { QuizizzResponse } from '../types';

export const fetchQuizData = async (quizId: string): Promise<QuizizzResponse> => {
  if (!quizId) {
    throw new Error('Quiz ID is required');
  }
  
  try {
    console.log(`Attempting to fetch quiz data for ID: ${quizId}`);
    
    // Call our Next.js API endpoint
    const response = await axios.get<QuizizzResponse>(`/api/quiz/${quizId}`, {
      timeout: 20000,
    });
    
    return response.data;
  } catch (err) {
    console.error('Error fetching from API:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw new Error(`Failed to fetch quiz ${quizId}: ${err.message}`);
    }
    
    throw new Error(`Failed to fetch quiz ${quizId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}; 