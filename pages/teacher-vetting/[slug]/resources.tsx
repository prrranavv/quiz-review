import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { QuizSummary, TeacherVettingCSVData } from '../../../types';
import { safeGetFromLocalStorage, safeSetToLocalStorage } from '../../../utils/localStorage';
import Navigation from '../../../components/Navigation';
import TeacherVettingQuizViewer from '../../../components/TeacherVettingQuizViewer';
import { parseTeacherVettingCSVToQuizSummaries } from '../../../utils/treeBuilder';
import { getTeacherVettingUploadedFiles, downloadTeacherVettingFile, isSupabaseConfigured } from '../../../utils/supabase';
import { slugify } from '../../../utils/slug';

// lightweight CSV parser for teacher vetting data
function parseCSV(text: string): TeacherVettingCSVData[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const data: TeacherVettingCSVData[] = [];
  
  // Find column indices for teacher vetting format
  const stateIdx = headers.findIndex(h => h.includes('state'));
  const subjectIdx = headers.findIndex(h => h.includes('subject'));
  const gradeIdx = headers.findIndex(h => h.includes('grade'));
  const domainIdx = headers.findIndex(h => h.includes('domain'));
  const topicIdx = headers.findIndex(h => h.includes('topic'));
  const instructureCodeIdx = headers.findIndex(h => h.includes('instructure_code'));
  const displayStandardCodeIdx = headers.findIndex(h => h.includes('display_standard_code'));
  const descriptionIdx = headers.findIndex(h => h.includes('description'));
  const quizIdIdx = headers.findIndex(h => h.includes('quiz_id'));
  const quizTitleIdx = headers.findIndex(h => h.includes('quiz_title'));
  const quizTypeIdx = headers.findIndex(h => h.includes('quiz_type'));
  const numQuestionsIdx = headers.findIndex(h => h.includes('num_questions'));
  const varietyTagIdx = headers.findIndex(h => h.includes('variety_tag'));
  const scoreIdx = headers.findIndex(h => h.includes('score'));
  
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
    const quizId = cells[quizIdIdx] || '';
    if (!quizId) continue;
    
    data.push({
      quiz_id: quizId,
      state: stateIdx >= 0 ? cells[stateIdx] : '',
      subject: subjectIdx >= 0 ? cells[subjectIdx] : '',
      grade: gradeIdx >= 0 ? cells[gradeIdx] : '',
      domain: domainIdx >= 0 ? cells[domainIdx] : '',
      topic: topicIdx >= 0 ? cells[topicIdx] : '',
      instructure_code: instructureCodeIdx >= 0 ? cells[instructureCodeIdx] : '',
      display_standard_code: displayStandardCodeIdx >= 0 ? cells[displayStandardCodeIdx] : '',
      description: descriptionIdx >= 0 ? cells[descriptionIdx] : '',
      quiz_title: quizTitleIdx >= 0 ? cells[quizTitleIdx] : '',
      quiz_type: quizTypeIdx >= 0 ? cells[quizTypeIdx] : '',
      num_questions: numQuestionsIdx >= 0 ? parseInt(cells[numQuestionsIdx]) || 0 : 0,
      variety_tag: varietyTagIdx >= 0 ? cells[varietyTagIdx] : '',
      score: scoreIdx >= 0 ? parseFloat(cells[scoreIdx]) || 0 : 0,
    });
  }
  return data;
}

export default function TeacherVettingResources() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  // Load quiz data on mount when slug is available
  useEffect(() => {
    if (!slug) return;
    const savedQuizzes = safeGetFromLocalStorage<QuizSummary[]>(`teacherVettingQuizData:${slug}`, []);
    const savedFileName = safeGetFromLocalStorage<string>(`teacherVettingFileName:${slug}`, '');

    if (savedQuizzes.length > 0) {
      setQuizzes(savedQuizzes);
      setFileName(savedFileName);
    } else {
      // attempt to fetch file from Supabase matching slug
      (async () => {
        try {
          const files = await getTeacherVettingUploadedFiles();
          const match = files.find((f: any) => slugify(f.name.replace(/^teacher-vetting-\d+-/, '').replace('.csv','')) === slug);
          if (match) {
            const blob = await downloadTeacherVettingFile(match.name);
            const text = await blob.text();
            const csvData = parseCSV(text);
            const summaries = parseTeacherVettingCSVToQuizSummaries(csvData);
            safeSetToLocalStorage(`teacherVettingQuizData:${slug}`, summaries);
            safeSetToLocalStorage(`teacherVettingFileName:${slug}`, match.name);
            setQuizzes(summaries);
            setFileName(match.name);
          } else {
            router.push('/teacher-vetting');
          }
        } catch (err) {
          router.push('/teacher-vetting');
        }
      })();
    }
  }, [slug, router]);

  const handleBackToHome = () => {
    router.push('/teacher-vetting');
  };

  const handleFolderNameChange = (newFileName: string) => {
    setFileName(newFileName);
    // Update localStorage with the new filename
    if (slug) {
      safeSetToLocalStorage(`teacherVettingFileName:${slug}`, newFileName);
    }
  };

  const getDisplayName = (fileName: string) => {
    // Remove timestamp prefix and .csv extension
    return fileName.replace(/^teacher-vetting-\d+-/, '').replace('.csv', '');
  };

  return (
    <> 
      <Head>
        <title>Teacher Vetting: {fileName ? getDisplayName(fileName) : 'HQRL Resources'}</title>
        <link rel="icon" href="/books.png" />
      </Head>
      <TeacherVettingQuizViewer 
        quizzes={quizzes} 
        onBack={handleBackToHome} 
        folderName={fileName ? getDisplayName(fileName) : ''} 
        onFolderNameChange={handleFolderNameChange}
      />
    </>
  );
}


 