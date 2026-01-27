import { redirect } from 'next/navigation'

export default function Home() {
  // Root page redirects to login
  // Middleware will handle authenticated users
  redirect('/login')
}