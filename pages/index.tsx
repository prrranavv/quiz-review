import Head from 'next/head';
import App from '../components/App';

export default function Home() {
  return (
    <>
      <Head>
        <title>Quiz Review App</title>
        <meta name="description" content="Quiz review application for batch processing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <App />
    </>
  );
} 