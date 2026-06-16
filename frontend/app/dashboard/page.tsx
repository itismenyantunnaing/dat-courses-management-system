import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'  

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/')
  }
  
  // ← Pass session data as props to the client component
  return <DashboardClient userData={session} />
}
