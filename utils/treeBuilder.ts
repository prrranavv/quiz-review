import { CSVQuizData, QuizSummary, TreeNode } from '../types';

export function buildTreeFromQuizzes(quizzes: QuizSummary[]): TreeNode[] {
  const domainMap = new Map<string, TreeNode>();
  
  quizzes.forEach(quiz => {
    // Only use domain/topic if they have actual values
    const domain = quiz.domain?.trim() || null;
    const topic = quiz.topic?.trim() || null;  
    const standard = quiz.standard?.trim() || 'Uncategorized';
    
    // Build hierarchy key based on available data
    let hierarchyKey = '';
    let domainNode: TreeNode | null = null;
    let topicNode: TreeNode | null = null;
    let standardNode: TreeNode | null = null;
    
    // Level 1: Domain (only if exists)
    if (domain) {
      hierarchyKey = `domain:${domain}`;
      if (!domainMap.has(hierarchyKey)) {
        domainNode = {
          id: hierarchyKey,
          name: domain,
          type: 'domain',
          children: [],
          isExpanded: false
        };
        domainMap.set(hierarchyKey, domainNode);
      } else {
        domainNode = domainMap.get(hierarchyKey)!;
      }
    }
    
    // Level 2: Topic (only if exists)
    if (topic) {
      hierarchyKey = domain ? `domain:${domain}|topic:${topic}` : `topic:${topic}`;
      
      const parentMap = domain ? (domainNode?.children || []) : Array.from(domainMap.values());
      topicNode = parentMap.find(child => child.type === 'topic' && child.name === topic) as TreeNode;
      
      if (!topicNode) {
        topicNode = {
          id: hierarchyKey,
          name: topic,
          type: 'topic',
          children: [],
          isExpanded: false
        };
        
        if (domain && domainNode) {
          domainNode.children.push(topicNode);
        } else {
          // Topic is root level
          domainMap.set(hierarchyKey, topicNode);
        }
      }
    }
    
    // Level 3: Standard (always exists)
    hierarchyKey = topic 
      ? (domain ? `domain:${domain}|topic:${topic}|standard:${standard}` : `topic:${topic}|standard:${standard}`)
      : (domain ? `domain:${domain}|standard:${standard}` : `standard:${standard}`);
    
    const parentForStandard = topicNode || domainNode;
    const parentMap = parentForStandard ? parentForStandard.children : Array.from(domainMap.values());
    standardNode = parentMap.find(child => child.type === 'standard' && child.name === standard) as TreeNode;
    
    if (!standardNode) {
      standardNode = {
        id: hierarchyKey,
        name: standard,
        type: 'standard',
        children: [],
        isExpanded: false,
        description: quiz.description
      };
      
      if (parentForStandard) {
        parentForStandard.children.push(standardNode);
      } else {
        // Standard is root level
        domainMap.set(hierarchyKey, standardNode);
      }
    }
    
    // Add quiz to standard level
    const quizNode: TreeNode = {
      id: `quiz-${quiz.id}`,
      name: quiz.title || `Quiz ${quiz.id.substring(0, 8)}...`,
      type: 'quiz',
      children: [],
      quizId: quiz.id,
      quiz: quiz
    };
    standardNode.children.push(quizNode);
  });
  
  // Convert map to array and sort
  const rootNodes = Array.from(domainMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Sort children at each level
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };
  
  sortNodes(rootNodes);
  return rootNodes;
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