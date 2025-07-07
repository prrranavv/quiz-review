import Head from 'next/head';
import TeacherAssignedView from '@/components/TeacherAssignedView';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Teachers() {
  return (
    <>
      <Head>
        <title>Teachers - HQRL Resources</title>
        <meta name="description" content="Teachers portal for reviewing assigned content" />
        <link rel="icon" href="/books.png" />
      </Head>
      <ErrorBoundary>
        <TeacherAssignedView />
      </ErrorBoundary>
    </>
  );
} 