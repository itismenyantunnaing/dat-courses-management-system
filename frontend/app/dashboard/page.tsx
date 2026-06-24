import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'  

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/')
  }
  
  return <DashboardClient userData={session} />
}
