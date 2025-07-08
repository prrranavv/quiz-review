import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import TeacherVettingQuizViewer from '@/components/TeacherVettingQuizViewer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { QuizSummary } from '@/types';
import { safeGetFromLocalStorage, safeSetToLocalStorage } from '@/utils/localStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const TeacherResources = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [quizSummaries, setQuizSummaries] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderName, setFolderName] = useState<string>('');

  useEffect(() => {
    if (slug && typeof slug === 'string') {
      try {
        setLoading(true);
        setError(null);
        
        // Get data from localStorage using the same format as teacher vetting
        const savedQuizzes = safeGetFromLocalStorage(`teacherVettingQuizData:${slug}`, []);
        const savedFileName = safeGetFromLocalStorage(`teacherVettingFileName:${slug}`, slug);
        
        if (savedQuizzes.length > 0) {
          setQuizSummaries(savedQuizzes);
          setFolderName(savedFileName);
        } else {
          setError('No data found for this assignment. Please try selecting it again from the main page.');
        }
      } catch (err) {
        console.error('Error loading teacher assignment data:', err);
        setError('Failed to load assignment data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [slug]);

  const handleBackClick = () => {
    router.push('/teachers');
  };

  const handleFolderNameChange = (newFileName: string) => {
    setFolderName(newFileName);
    // Update localStorage with the new filename
    if (slug && typeof slug === 'string') {
      safeSetToLocalStorage(`teacherVettingFileName:${slug}`, newFileName);
    }
  };

  const getDisplayName = (fileName: string) => {
    // Remove timestamp prefix and .csv extension
    return fileName.replace(/^teacher-vetting-\d+-/, '').replace('.csv', '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading your assignment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-destructive mb-2">
                  Assignment Not Found
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {error}
                </p>
                <Button onClick={handleBackClick} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assignments
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{folderName ? getDisplayName(folderName) : 'Teacher Assignment'}</title>
        <meta name="description" content="Teacher assignment review interface" />
        <link rel="icon" href="/books.png" />
      </Head>
      <ErrorBoundary>
        <TeacherVettingQuizViewer 
          quizzes={quizSummaries}
          folderName={folderName}
          onBack={handleBackClick}
          onFolderNameChange={handleFolderNameChange}
        />
      </ErrorBoundary>
    </>
  );
};

export default TeacherResources; 