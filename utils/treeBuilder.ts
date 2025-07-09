import { CSVQuizData, QuizSummary, TreeNode, TeacherVettingCSVData } from '../types';

export function buildTreeFromQuizzes(quizzes: QuizSummary[]): TreeNode[] {
  const domainMap = new Map<string, TreeNode>();
  
  quizzes.forEach(quiz => {
    // Only use domain/topic if they have actual values
    const domain = quiz.domain?.trim() || null;
    const topic = quiz.topic?.trim() || null;  
    const standard = quiz.standard?.trim() || null;
    const varietyTag = quiz.variety_tag?.trim() || 'General';
    
    // Determine the review level based on available data
    let reviewLevel: 'domain' | 'topic' | 'standard' = 'standard';
    let reviewName = 'Uncategorized';
    
    if (domain && !topic && !standard) {
      reviewLevel = 'domain';
      reviewName = 'Domain Review';
    } else if (domain && topic && !standard) {
      reviewLevel = 'topic';
      reviewName = 'Topic Review';
    } else if (standard) {
      reviewLevel = 'standard';
      reviewName = standard;
    }
    
    // Build hierarchy key based on available data
    let hierarchyKey = '';
    let domainNode: TreeNode | null = null;
    let topicNode: TreeNode | null = null;
    let standardNode: TreeNode | null = null;
    let varietyNode: TreeNode | null = null;
    
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
    
    // Level 3: Standard/Review (always exists)
    hierarchyKey = topic 
      ? (domain ? `domain:${domain}|topic:${topic}|standard:${reviewName}` : `topic:${topic}|standard:${reviewName}`)
      : (domain ? `domain:${domain}|standard:${reviewName}` : `standard:${reviewName}`);
    
    const parentForStandard = topicNode || domainNode;
    const parentMap = parentForStandard ? parentForStandard.children : Array.from(domainMap.values());
    standardNode = parentMap.find(child => child.type === reviewLevel && child.name === reviewName) as TreeNode;
    
    if (!standardNode) {
      standardNode = {
        id: hierarchyKey,
        name: reviewName,
        type: reviewLevel,
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
    
    // Level 4: Variety Tag (new level)
    if (!standardNode) {
      throw new Error(`Standard node should not be null for quiz ${quiz.id}`);
    }
    
    hierarchyKey = topic 
      ? (domain ? `domain:${domain}|topic:${topic}|standard:${reviewName}|variety:${varietyTag}` : `topic:${topic}|standard:${reviewName}|variety:${varietyTag}`)
      : (domain ? `domain:${domain}|standard:${reviewName}|variety:${varietyTag}` : `standard:${reviewName}|variety:${varietyTag}`);
    
    varietyNode = standardNode.children.find(child => child.type === 'variety' && child.name === varietyTag) as TreeNode;
    
    if (!varietyNode) {
      varietyNode = {
        id: hierarchyKey,
        name: varietyTag,
        type: 'variety',
        children: [],
        isExpanded: false
      };
      standardNode.children.push(varietyNode);
    }
    
    // Add quiz to variety level
    const quizNode: TreeNode = {
      id: `quiz-${quiz.id}`,
      name: quiz.title || `Quiz ${quiz.id.substring(0, 8)}...`,
      type: 'quiz',
      children: [],
      quizId: quiz.id,
      quiz: quiz
    };
    varietyNode.children.push(quizNode);
  });
  
  // Convert map to array and sort
  const rootNodes = Array.from(domainMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Sort children at each level
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      // Sort quizzes by score in descending order
      if (a.type === 'quiz' && b.type === 'quiz') {
        const scoreA = a.quiz?.score ?? -Infinity;
        const scoreB = b.quiz?.score ?? -Infinity;
        // Sort by score descending, then by name ascending if scores are equal
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return a.name.localeCompare(b.name);
      }
      
      // For non-quiz nodes, prioritize review nodes at the top
      const isAReview = a.name === 'Domain Review' || a.name === 'Topic Review';
      const isBReview = b.name === 'Domain Review' || b.name === 'Topic Review';
      
      if (isAReview && !isBReview) {
        return -1; // A (review) comes before B (non-review)
      }
      if (!isAReview && isBReview) {
        return 1; // B (review) comes before A (non-review)
      }
      
      // Both are reviews or both are non-reviews, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
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
    teacherName: row.teacherName,
    // Keep legacy fields for backward compatibility
    subject: row.subject,
    grade: row.grade
  }));
}

export function parseTeacherVettingCSVToQuizSummaries(csvData: TeacherVettingCSVData[]): QuizSummary[] {
  return csvData.map(row => ({
    id: row.quiz_id,
    title: row.quiz_title || `Quiz ${row.quiz_id.substring(0, 8)}...`,
    questionCount: row.num_questions || 0,
    status: 'loaded' as const,
    domain: row.domain,
    topic: row.topic,
    standard: row.display_standard_code || row.instructure_code,
    description: row.description,
    // Teacher vetting specific fields
    state: row.state,
    subject: row.subject,
    grade: row.grade,
    instructure_code: row.instructure_code,
    display_standard_code: row.display_standard_code,
    quiz_type: row.quiz_type,
    variety_tag: row.variety_tag,
    score: row.score
  }));
} 