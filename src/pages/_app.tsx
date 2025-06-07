import type { AppProps } from 'next/app'
import Head from 'next/head'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '../styles/globals.css'

export default function CivicaS({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>CivicaS</title>
        <meta name="description" content="Your personal travel companion" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
