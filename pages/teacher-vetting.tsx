import Head from 'next/head';
import TeacherVettingApp from '@/components/TeacherVettingApp';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function TeacherVetting() {
  return (
    <>
      <Head>
        <title>Teacher Vetting - HQRL Resources</title>
        <meta name="description" content="Teacher Vetting for educational content curation" />
        <link rel="icon" href="/books.png" />
      </Head>
      <ErrorBoundary>
        <TeacherVettingApp />
      </ErrorBoundary>
    </>
  );
} 