// Question media content
export interface MediaContent {
  url?: string;
  type?: string;
  title?: string;
}

// Question structure for API responses
export interface QuizizzQuestion {
  _id: string;
  type: string;
  structure: {
    query: {
      text: string;
      media?: MediaContent[];
    };
    options: {
      text: string;
      media?: MediaContent[];
    }[];
    answer: number[];
    explain?: {
      text: string;
      media?: MediaContent[];
    };
  };
}

// Quiz info structure
export interface QuizizzInfo {
  name: string;
  image?: string;
  questions: QuizizzQuestion[];
}

// Quiz structure
export interface QuizizzQuiz {
  _id: string;
  info: QuizizzInfo;
}

// API response structure
export interface QuizizzResponse {
  data: {
    quiz: QuizizzQuiz;
  };
}

// CSV row data structure
export interface CSVQuizData {
  id: string;
  standard?: string;
  subject?: string;
  grade?: string;
  topic?: string;
}

// Quiz summary for list view
export interface QuizSummary {
  id: string;
  title: string;
  image?: string;
  questionCount: number;
  status: 'loading' | 'loaded' | 'error';
  data?: QuizizzResponse;
  error?: string;
  // Metadata from CSV
  standard?: string;
  subject?: string;
  grade?: string;
  topic?: string;
}

// Grouped quizzes by standard
export interface GroupedQuizzes {
  [standard: string]: QuizSummary[];
}

// Note: Feedback functionality will be added in future iterations 