import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import QuizViewer from '../../components/QuizViewer';
import Modal from '../../components/Modal';
import CSVUpload from '../../components/CSVUpload';
import Notification from '../../components/Notification';
import Navigation from '../../components/Navigation';
import { QuizSummary, CSVQuizData } from '../../types';
import { uploadFile, isSupabaseConfigured, getUploadedFiles, downloadFile } from '../../utils/supabase';
import { parseCSVToQuizSummaries } from '../../utils/treeBuilder';
import { safeGetFromLocalStorage, safeSetToLocalStorage } from '../../utils/localStorage';
import { slugify } from '../../utils/slug';

// lightweight CSV parser to extract minimal columns (id, domain, topic, standard, description, title, questionCount)
function parseCSV(text: string): CSVQuizData[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const idIndex = headers.findIndex(h => h.includes('id'));
  const domainIdx = headers.findIndex(h => h.includes('domain'));
  const topicIdx = headers.findIndex(h => h.includes('topic'));
  const standardIdx = headers.findIndex(h => h.includes('standard'));
  const descIdx = headers.findIndex(h => h.includes('description'));
  const titleIdx = headers.findIndex(h => h.includes('title'));
  const qCountIdx = headers.findIndex(h => h.includes('num questions')||h.includes('question count'));
  const data: CSVQuizData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c=>c.replace(/"/g,'').trim());
    const id = cells[idIndex] || '';
    if (!id) continue;
    data.push({
      id,
      domain: domainIdx>=0?cells[domainIdx]:undefined,
      topic: topicIdx>=0?cells[topicIdx]:undefined,
      standard: standardIdx>=0?cells[standardIdx]:undefined,
      description: descIdx>=0?cells[descIdx]:undefined,
      title: titleIdx>=0?cells[titleIdx]:undefined,
      questionCount: qCountIdx>=0?parseInt(cells[qCountIdx]||'0'):0
    });
  }
  return data;
}

export default function FolderResources() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Load quiz data on mount when slug is available
  useEffect(() => {
    if (!slug) return;
    const savedQuizzes = safeGetFromLocalStorage<QuizSummary[]>(`quizData:${slug}`, []);
    const savedFileName = safeGetFromLocalStorage<string>(`fileName:${slug}`, slug);

    if (savedQuizzes.length > 0) {
      setQuizzes(savedQuizzes);
      setFileName(savedFileName);
    } else {
      // attempt to fetch file from Supabase matching slug
      (async () => {
        try {
          const files = await getUploadedFiles();
          const match = files.find((f: any) => slugify(f.name.replace(/^[0-9]+-/, '').replace('.csv','')) === slug);
          if (match) {
            const blob = await downloadFile(match.name);
            const text = await blob.text();
            const csvData = parseCSV(text);
            const summaries = parseCSVToQuizSummaries(csvData);
            safeSetToLocalStorage(`quizData:${slug}`, summaries);
            safeSetToLocalStorage(`fileName:${slug}`, match.name.replace(/^[0-9]+-/, '').replace('.csv',''));
            setQuizzes(summaries);
            setFileName(match.name.replace(/^[0-9]+-/, '').replace('.csv',''));
          } else {
            router.push('/');
          }
        } catch (err) {
          router.push('/');
        }
      })();
    }
  }, [slug, router]);

  // CSV upload handler (same as original but uses slug)
  const handleQuizIdsExtracted = async (quizData: CSVQuizData[], file: File) => {
    if (!slug) return;
    setLoading(true);
    setIsUploadModalOpen(false);
    try {
      let uploadSuccess = false;
      if (isSupabaseConfigured()) {
        try {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name}`;
          await uploadFile(file, fileName);
          uploadSuccess = true;
        } catch {}
      }
      const quizSummaries = parseCSVToQuizSummaries(quizData);
      safeSetToLocalStorage(`quizData:${slug}`, quizSummaries);
      safeSetToLocalStorage(`fileName:${slug}`, file.name);
      setQuizzes(quizSummaries);
      setFileName(file.name);
      showNotification(`Processed ${quizData.length} quizzes`, uploadSuccess ? 'success' : 'warning');
    } catch (err) {
      showNotification('Failed to process file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <> 
      <Head>
        <title>{fileName || 'HQRL Resources'}</title>
        <link rel="icon" href="/books.png" />
      </Head>
      <Navigation />
      <QuizViewer quizzes={quizzes} onBack={handleBackToHome} folderName={fileName || slugify(fileName || '')} />
      <Modal isOpen={isUploadModalOpen} onClose={()=>setIsUploadModalOpen(false)} title="Upload Quiz CSV">
        <CSVUpload onQuizIdsExtracted={handleQuizIdsExtracted} loading={loading} onError={(m)=>showNotification(m,'error')} />
      </Modal>
      <Notification {...notification} onClose={hideNotification} />
    </>
  );
} 