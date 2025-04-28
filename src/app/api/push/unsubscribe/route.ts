import { NextResponse } from 'next/server'
import type { PushSubscription } from '../types'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'src/data')
const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscribers.json')

async function getSubscriptions(): Promise<PushSubscription[]> {
  const data = await readFile(SUBSCRIPTIONS_FILE, 'utf-8')
  const parsedData = JSON.parse(data)
  return parsedData.subscriptions || []
}

async function saveSubscriptions(subscriptions: PushSubscription[]) {
  await writeFile(SUBSCRIPTIONS_FILE, JSON.stringify({ subscriptions }, null, 2))
}

export async function POST(request: Request) {
  try {
    const subscription = await request.json()
    console.log('Lösche Subscription:', subscription.endpoint)
    
    const subscriptions = await getSubscriptions()
    const updatedSubscriptions = subscriptions.filter(sub => sub.endpoint !== subscription.endpoint)
    await saveSubscriptions(updatedSubscriptions)
    
    console.log('Verbleibende Subscriptions:', updatedSubscriptions.length)
    return NextResponse.json({ message: 'Erfolgreich abbestellt' })
  } catch (error) {
    console.error('Fehler beim Abbestellen:', error)
    return NextResponse.json({ error: 'Fehler beim Abbestellen' }, { status: 500 })
  }
} 