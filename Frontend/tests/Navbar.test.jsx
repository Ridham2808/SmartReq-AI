import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'

jest.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/hooks/useAuth', () => ({ useAuthStore: () => ({ user: null, token: null, logout: jest.fn() }) }))

describe('Navbar', () => {
  it('renders brand and links', () => {
    render(<Navbar />)
    expect(screen.getByText('SmartReq AI')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
  })
})


