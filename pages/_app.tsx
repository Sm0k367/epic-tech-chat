// pages/_app.tsx
import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Epic Tech Chat - AI-Powered Chat Bot</title>
        <meta name="description" content="Epic Tech Chat: The ultra-human, AI-powered chat bot that talks, listens, sees, and does." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <style jsx global>{`
        * {
          box-sizing: border-box;
          padding: 0;
          margin: 0;
        }
        html,
        body {
          max-width: 100vw;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #0a0a0a;
          color: #fff;
        }
        a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>
    </>
  )
}
