import React, { useState } from 'react';
import { CSVQuizData } from '../types';

interface CSVUploadProps {
  onQuizIdsExtracted: (quizData: CSVQuizData[], file: File) => void;
  loading: boolean;
  onError?: (message: string) => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onQuizIdsExtracted, loading, onError }) => {
  const [dragActive, setDragActive] = useState(false);

  const parseCSV = (csvText: string): CSVQuizData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const quizData: CSVQuizData[] = [];
    
    console.log('CSV Headers:', headers);
    
    // Find column indices for new hierarchical format
    const domainColumn = headers.findIndex(h => 
      h.includes('domain') || h.includes('subject area')
    );
    const topicColumn = headers.findIndex(h => 
      h.includes('topic') || h.includes('chapter') || h.includes('unit')
    );
    const standardColumn = headers.findIndex(h => 
      h.includes('standard') || h.includes('std')
    );
    const descriptionColumn = headers.findIndex(h => 
      h.includes('description') || h.includes('desc')
    );
    const titleColumn = headers.findIndex(h => 
      h.includes('quiz title') || h.includes('title') || h.includes('name')
    );
    const numQuestionsColumn = headers.findIndex(h => 
      h.includes('num questions') || h.includes('question count') || h.includes('questions')
    );
    
    // Find quiz ID columns
    const quizIdColumns = headers.map((h, i) => 
      (h.includes('quiz') && h.includes('id')) || 
      h.includes('quizizz') || 
      h === 'id' ? i : -1
    ).filter(i => i >= 0);
    
    // Legacy column detection for backward compatibility
    const subjectColumn = headers.findIndex(h => 
      h.includes('subject') || h.includes('course')
    );
    const gradeColumn = headers.findIndex(h => 
      h.includes('grade') || h.includes('level')
    );
    
    console.log('Column indices:', {
      domain: domainColumn,
      topic: topicColumn,
      standard: standardColumn,
      description: descriptionColumn,
      title: titleColumn,
      numQuestions: numQuestionsColumn,
      quizId: quizIdColumns
    });
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Split by comma but handle quoted fields
      const cells: string[] = [];
      let currentCell = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim()); // Add the last cell
      
      // Remove quotes from cells
      const cleanedCells = cells.map(cell => cell.replace(/"/g, '').trim());
      
      let quizId: string | null = null;
      
      // Try to find quiz ID in designated columns first
      for (const colIndex of quizIdColumns) {
        if (colIndex < cleanedCells.length) {
          const cell = cleanedCells[colIndex];
          if (cell && /^[a-fA-F0-9]{20,}$/.test(cell)) {
            quizId = cell;
            break;
          } else if (cell.includes('quizizz.com') && cell.includes('/')) {
            const match = cell.match(/\/([a-fA-F0-9]{20,})/);
            if (match) {
              quizId = match[1];
              break;
            }
          }
        }
      }
      
      // If not found, search all cells
      if (!quizId) {
        for (const cell of cleanedCells) {
          if (cell && /^[a-fA-F0-9]{20,}$/.test(cell)) {
            quizId = cell;
            break;
          } else if (cell.includes('quizizz.com') && cell.includes('/')) {
            const match = cell.match(/\/([a-fA-F0-9]{20,})/);
            if (match) {
              quizId = match[1];
              break;
            }
          }
        }
      }
      
      if (quizId) {
        const questionCount = numQuestionsColumn >= 0 && cleanedCells[numQuestionsColumn] 
          ? parseInt(cleanedCells[numQuestionsColumn]) || 0 
          : 0;
          
        const domain = domainColumn >= 0 ? cleanedCells[domainColumn] || undefined : undefined;
        const topic = topicColumn >= 0 ? cleanedCells[topicColumn] || undefined : undefined;
        const standard = standardColumn >= 0 ? cleanedCells[standardColumn] || undefined : undefined;
        const description = descriptionColumn >= 0 ? cleanedCells[descriptionColumn] || undefined : undefined;
        const title = titleColumn >= 0 ? cleanedCells[titleColumn] || undefined : undefined;
        const subject = subjectColumn >= 0 ? cleanedCells[subjectColumn] || undefined : undefined;
        const grade = gradeColumn >= 0 ? cleanedCells[gradeColumn] || undefined : undefined;
        
        console.log(`Row ${i}: QuizID=${quizId}, Title="${title}", Standard="${standard}"`);
          
        quizData.push({
          id: quizId,
          // New hierarchical fields
          domain: domain,
          topic: topic,
          standard: standard,
          description: description,
          title: title,
          questionCount: questionCount,
          // Legacy fields for backward compatibility
          subject: subject,
          grade: grade,
        });
      }
    }
    
    // Remove duplicates based on quiz ID
    const uniqueQuizData = quizData.filter((quiz, index, self) => 
      index === self.findIndex(q => q.id === quiz.id)
    );
    
    console.log(`Parsed ${uniqueQuizData.length} unique quizzes:`, uniqueQuizData);
    
    return uniqueQuizData;
  };

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      if (onError) {
        onError('Please upload a CSV file');
      } else {
        alert('Please upload a CSV file');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const quizData = parseCSV(csvText);
        
        if (quizData.length === 0) {
          if (onError) {
            onError('No quiz IDs found in the CSV file. Please ensure your CSV contains Quizizz quiz IDs.');
          } else {
            alert('No quiz IDs found in the CSV file. Please ensure your CSV contains Quizizz quiz IDs.');
          }
          return;
        }
        
        console.log(`Found ${quizData.length} quiz entries:`, quizData);
        onQuizIdsExtracted(quizData, file);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        if (onError) {
          onError('Failed to parse CSV file. Please check the file format.');
        } else {
          alert('Failed to parse CSV file. Please check the file format.');
        }
      }
    };
    
    reader.onerror = () => {
      if (onError) {
        onError('Failed to read the file. Please try again.');
      } else {
        alert('Failed to read the file. Please try again.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg
          className="mx-auto h-10 w-10 text-gray-400 mb-3"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        <div className="space-y-2">
          <p className="font-medium text-gray-700">
            Upload CSV with Quiz IDs
          </p>
          <p className="text-sm text-gray-500">
            Drag and drop or click to browse
          </p>
        </div>
        
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id="csv-upload"
          disabled={loading}
        />
        <label
          htmlFor="csv-upload"
          className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors text-sm"
        >
          Choose File
        </label>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
          <span className="text-gray-600 text-sm">Loading quizzes...</span>
        </div>
      )}
      
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Format:</strong> CSV with quiz IDs and hierarchical organization columns</p>
        <p><strong>Supports:</strong> Quiz IDs or full Quizizz URLs</p>
        <p><strong>Columns:</strong> Domain, Topic, Standard, Description, Quiz Title, Num Questions, Quiz ID</p>
        <p><strong>Legacy:</strong> Also supports Subject, Grade columns for backward compatibility</p>
      </div>
    </div>
  );
};

export default CSVUpload; 