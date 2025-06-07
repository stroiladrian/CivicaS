import type { AppProps } from 'next/app'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '../styles/globals.css'

function CivicaS({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default CivicaS
