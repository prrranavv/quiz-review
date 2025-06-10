import Head from 'next/head';
import App from '../components/App';

export default function Home() {
  return (
    <>
      <Head>
        <title>HQRL: Resources Curation</title>
        <meta name="description" content="High Quality Resource Library for educational content curation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <App />
    </>
  );
} 