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

// CSV row data structure - updated with hierarchical fields
export interface CSVQuizData {
  id: string;
  domain?: string;
  topic?: string;
  standard?: string;
  description?: string;
  title?: string;
  questionCount?: number;
  // Legacy fields for backward compatibility
  subject?: string;
  grade?: string;
}

// Quiz summary for list view - updated with hierarchical fields
export interface QuizSummary {
  id: string;
  title: string;
  image?: string;
  questionCount: number;
  status: 'loading' | 'loaded' | 'error';
  data?: QuizizzResponse;
  error?: string;
  // New hierarchical metadata
  domain?: string;
  topic?: string;
  standard?: string;
  description?: string;
  // Legacy metadata from CSV for backward compatibility
  subject?: string;
  grade?: string;
}

// Hierarchical tree structure for sidebar navigation
export interface TreeNode {
  id: string;
  name: string;
  type: 'domain' | 'topic' | 'standard' | 'quiz';
  children: TreeNode[];
  quizId?: string;
  isExpanded?: boolean;
  quiz?: QuizSummary;
  description?: string;
}

// Grouped quizzes by standard (legacy)
export interface GroupedQuizzes {
  [standard: string]: QuizSummary[];
}

// Note: Feedback functionality will be added in future iterations 