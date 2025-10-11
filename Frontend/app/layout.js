import './globals.css'
import Providers from './providers'
import FooterNav from './components/FooterNav'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'SmartReq AI – AI Requirement Gathering for Fintech Automation | User Stories Generator',
  description: 'SmartReq AI accelerates AI requirement gathering for fintech automation with an AI user stories generator, NLP-powered multi-modal inputs, and compliance-ready flows.',
  keywords: [
    'AI requirement gathering',
    'fintech automation',
    'user stories generator',
    'requirements management',
    'NLP',
    'OpenAI',
    'KYC',
    'GDPR',
    'Jira integration'
  ],
}

export default function RootLayout({ children, modal }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          {children}
          {modal}
          <FooterNav />
        </Providers>
      </body>
    </html>
  )
}


