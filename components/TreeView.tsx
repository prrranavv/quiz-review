import React, { useState, useMemo, useEffect } from 'react';
import { TreeNode, QuizSummary } from '../types';
import { File, Check, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TreeViewProps {
  nodes: TreeNode[];
  onQuizSelect: (quiz: QuizSummary) => void;
  selectedQuizId?: string;
  reviewedQuizzes?: Set<string>;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  onQuizSelect: (quiz: QuizSummary) => void;
  selectedQuizId?: string;
  reviewedQuizzes?: Set<string>;
  level?: number;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ 
  node, 
  onQuizSelect, 
  selectedQuizId, 
  reviewedQuizzes,
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(node.isExpanded || false);
  
  // Debug logging for quiz nodes
  if (node.type === 'quiz' && node.quizId) {
    console.log('🔍 [TreeView] Quiz check:', {
      quizId: node.quizId,
      hasReviewedQuizzes: !!reviewedQuizzes,
      isInReviewedSet: reviewedQuizzes?.has(node.quizId),
      reviewedQuizzesArray: reviewedQuizzes ? Array.from(reviewedQuizzes) : 'undefined'
    });
    
    if (reviewedQuizzes?.has(node.quizId)) {
      console.log('🔍 [TreeView] Rendering "Reviewed" label for quiz:', node.quizId);
    }
  }
  
  // Update expansion state when node.isExpanded changes (for search filtering)
  useEffect(() => {
    if (node.isExpanded !== undefined) {
      setIsExpanded(node.isExpanded);
    }
  }, [node.isExpanded]);
  
  const handleToggle = () => {
    if (node.children.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleQuizClick = () => {
    if (node.type === 'quiz' && node.quiz) {
      onQuizSelect(node.quiz);
    }
  };

  const getIcon = () => {
    switch (node.type) {
      case 'domain':
        return (
          <div className="w-4 h-4 bg-blue-600 text-white text-xs font-bold rounded flex items-center justify-center">
            D
          </div>
        );
      case 'topic':
        return (
          <div className="w-4 h-4 bg-green-600 text-white text-xs font-bold rounded flex items-center justify-center">
            T
          </div>
        );
      case 'standard':
        return (
          <div className="w-4 h-4 bg-yellow-600 text-white text-xs font-bold rounded flex items-center justify-center">
            S
          </div>
        );
      case 'variety':
        return (
          <div className="w-4 h-4 bg-purple-600 text-white text-xs font-bold rounded flex items-center justify-center">
            V
          </div>
        );
      case 'quiz':
        return (
          <File className="w-4 h-4 text-purple-600" />
        );
      default:
        return null;
    }
  };

  const getExpandIcon = () => {
    if (node.children.length === 0) return null;
    
    return isExpanded ? (
      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    );
  };

  const isSelected = node.type === 'quiz' && node.quizId === selectedQuizId;
  const paddingLeft = `${(level + 1) * 16}px`;

  return (
    <div>
      <div
        className={`flex items-start py-2 px-2 cursor-pointer hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft }}
        onClick={node.type === 'quiz' ? handleQuizClick : handleToggle}
      >
        <div className="flex items-start flex-1 min-w-0">
          <div className="flex-shrink-0 mr-2 mt-1">
            {getExpandIcon()}
          </div>
          <div className="flex-shrink-0 mr-3 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className={`text-sm leading-5 ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                {node.type === 'quiz' ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 min-w-0 truncate">{node.name}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium flex-shrink-0">
                      {node.quiz?.questionCount && node.quiz.questionCount > 0 && (
                        <span className="text-gray-600">{node.quiz.questionCount} Qs</span>
                      )}
                      {node.quiz?.score !== undefined && node.quiz.score !== null && (
                        <div className="w-5 h-5 bg-slate-500 text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-sm">
                          {Math.round(node.quiz.score * 10) / 10}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  node.name
                )}
              </div>
              {node.type === 'quiz' && node.quizId && reviewedQuizzes?.has(node.quizId) && (
                <div className="flex items-center text-green-600 ml-2">
                  <Check className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Reviewed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              onQuizSelect={onQuizSelect}
              selectedQuizId={selectedQuizId}
              reviewedQuizzes={reviewedQuizzes}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeView: React.FC<TreeViewProps> = ({ nodes, onQuizSelect, selectedQuizId, reviewedQuizzes }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debug log when reviewedQuizzes prop changes
  useEffect(() => {
    console.log('🔍 [TreeView] reviewedQuizzes prop changed:', reviewedQuizzes ? Array.from(reviewedQuizzes) : 'undefined');
  }, [reviewedQuizzes]);

  // Function to check if a node matches the search term
  const matchesSearch = (node: TreeNode, term: string): boolean => {
    if (!term) return true;
    
    const lowerTerm = term.toLowerCase();
    
    // Check node name
    if (node.name.toLowerCase().includes(lowerTerm)) return true;
    
    // For quiz nodes, also check quiz ID and title
    if (node.type === 'quiz' && node.quiz) {
      if (node.quiz.id.toLowerCase().includes(lowerTerm)) return true;
      if (node.quiz.title.toLowerCase().includes(lowerTerm)) return true;
    }
    
    return false;
  };

  // Function to check if any descendant matches the search
  const hasMatchingDescendant = (node: TreeNode, term: string): boolean => {
    if (matchesSearch(node, term)) return true;
    return node.children.some(child => hasMatchingDescendant(child, term));
  };

  // Function to filter and modify nodes based on search
  const filterNodes = (nodeList: TreeNode[], term: string): TreeNode[] => {
    if (!term) return nodeList;

    return nodeList
      .map(node => {
        // Clone the node to avoid mutating the original
        const filteredNode = { ...node };
        
        // Filter children recursively
        filteredNode.children = filterNodes(node.children, term);
        
        // Include this node if it matches search or has matching descendants
        const shouldInclude = matchesSearch(node, term) || filteredNode.children.length > 0;
        
        if (shouldInclude) {
          // Expand nodes that have matching descendants but don't match themselves
          if (!matchesSearch(node, term) && filteredNode.children.length > 0) {
            filteredNode.isExpanded = true;
          }
          return filteredNode;
        }
        
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  };

  const filteredNodes = useMemo(() => filterNodes(nodes, searchTerm), [nodes, searchTerm]);

  // Count total quiz nodes in filtered tree
  const countQuizNodes = (nodeList: TreeNode[]): number => {
    return nodeList.reduce((count, node) => {
      const currentCount = node.type === 'quiz' ? 1 : 0;
      const childCount = countQuizNodes(node.children);
      return count + currentCount + childCount;
    }, 0);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search standards, quiz IDs, titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-8 text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-xs text-gray-500">
            {filteredNodes.length > 0 
              ? `Found ${countQuizNodes(filteredNodes)} quizzes` 
              : 'No matches found'
            }
          </div>
        )}
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {filteredNodes.length > 0 ? (
            filteredNodes.map((node) => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                onQuizSelect={onQuizSelect}
                selectedQuizId={selectedQuizId}
                reviewedQuizzes={reviewedQuizzes}
              />
            ))
          ) : searchTerm ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results found for "{searchTerm}"</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for standards, quiz IDs, or titles</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Loading quiz hierarchy...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeView; 