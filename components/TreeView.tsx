import React, { useState } from 'react';
import { TreeNode, QuizSummary } from '../types';

interface TreeViewProps {
  nodes: TreeNode[];
  onQuizSelect: (quiz: QuizSummary) => void;
  selectedQuizId?: string;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  onQuizSelect: (quiz: QuizSummary) => void;
  selectedQuizId?: string;
  level?: number;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ 
  node, 
  onQuizSelect, 
  selectedQuizId, 
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(node.isExpanded || false);
  
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
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
        );
      case 'topic':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
        );
      case 'standard':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z" clipRule="evenodd" />
          </svg>
        );
      case 'quiz':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
          </svg>
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
            <div className={`text-sm leading-5 ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
              {node.name}
            </div>
            {node.type === 'quiz' && (
              <div className="text-xs text-gray-500 mt-1">
                <div className="font-mono text-xs break-all bg-gray-50 px-2 py-1 rounded">
                  {node.quizId}
                </div>
              </div>
            )}
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
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeView: React.FC<TreeViewProps> = ({ nodes, onQuizSelect, selectedQuizId }) => {
  return (
    <div className="h-full overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quiz Library</h3>
      </div>
      <div className="py-2">
        {nodes.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            onQuizSelect={onQuizSelect}
            selectedQuizId={selectedQuizId}
          />
        ))}
      </div>
    </div>
  );
};

export default TreeView; 