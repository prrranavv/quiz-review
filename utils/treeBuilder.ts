import { CSVQuizData, QuizSummary, TreeNode } from '../types';

export function buildTreeFromQuizzes(quizzes: QuizSummary[]): TreeNode[] {
  const domainMap = new Map<string, TreeNode>();
  
  quizzes.forEach(quiz => {
    const domain = quiz.domain || 'Unknown Domain';
    const topic = quiz.topic || 'Unknown Topic';  
    const standard = quiz.standard || 'Unknown Standard';
    
    // Create or get domain node
    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        id: `domain-${domain}`,
        name: domain,
        type: 'domain',
        children: [],
        isExpanded: false
      });
    }
    const domainNode = domainMap.get(domain)!;
    
    // Find or create topic node within domain
    let topicNode = domainNode.children.find(child => 
      child.type === 'topic' && child.name === topic
    );
    if (!topicNode) {
      topicNode = {
        id: `topic-${domain}-${topic}`,
        name: topic,
        type: 'topic',
        children: [],
        isExpanded: false
      };
      domainNode.children.push(topicNode);
    }
    
    // Find or create standard node within topic
    let standardNode = topicNode.children.find(child => 
      child.type === 'standard' && child.name === standard
    );
    if (!standardNode) {
      standardNode = {
        id: `standard-${domain}-${topic}-${standard}`,
        name: standard,
        type: 'standard',
        children: [],
        isExpanded: false
      };
      topicNode.children.push(standardNode);
    }
    
    // Add quiz node to standard
    const quizNode: TreeNode = {
      id: `quiz-${quiz.id}`,
      name: quiz.title || `Quiz ${quiz.id}`,
      type: 'quiz',
      children: [],
      quizId: quiz.id,
      quiz: quiz
    };
    standardNode.children.push(quizNode);
  });
  
  // Convert map to array and sort
  const domains = Array.from(domainMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Sort children at each level
  domains.forEach(domain => {
    domain.children.sort((a, b) => a.name.localeCompare(b.name));
    domain.children.forEach(topic => {
      topic.children.sort((a, b) => a.name.localeCompare(b.name));
      topic.children.forEach(standard => {
        standard.children.sort((a, b) => a.name.localeCompare(b.name));
      });
    });
  });
  
  return domains;
}

export function parseCSVToQuizSummaries(csvData: CSVQuizData[]): QuizSummary[] {
  return csvData.map(row => ({
    id: row.id,
    title: row.title || `Quiz ${row.id.substring(0, 8)}...`,
    questionCount: row.questionCount || 0,
    status: 'loaded' as const,
    domain: row.domain,
    topic: row.topic,
    standard: row.standard,
    description: row.description,
    // Keep legacy fields for backward compatibility
    subject: row.subject,
    grade: row.grade
  }));
} 