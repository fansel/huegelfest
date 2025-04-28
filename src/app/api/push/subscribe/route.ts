import { NextResponse } from 'next/server'
import webpush from 'web-push'
import type { PushSubscription } from '../types'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'

// VAPID-Schlüssel aus den Umgebungsvariablen
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID-Schlüssel fehlen in den Umgebungsvariablen');
}

const DATA_DIR = join(process.cwd(), 'src/data')
const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscribers.json')

webpush.setVapidDetails(
  'mailto:your-email@example.com', // Ersetzen Sie dies mit Ihrer E-Mail
  vapidPublicKey,
  vapidPrivateKey
)

async function ensureDataDirectory() {
  try {
    await mkdir(DATA_DIR, { recursive: true })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
      return
    }
    throw error
  }
}

async function ensureSubscriptionsFile() {
  try {
    await readFile(SUBSCRIPTIONS_FILE)
  } catch {
    await writeFile(SUBSCRIPTIONS_FILE, JSON.stringify({ subscriptions: [] }, null, 2))
  }
}

async function getSubscriptions(): Promise<PushSubscription[]> {
  await ensureDataDirectory()
  await ensureSubscriptionsFile()
  const data = await readFile(SUBSCRIPTIONS_FILE, 'utf-8')
  const parsedData = JSON.parse(data)
  return parsedData.subscriptions || []
}

async function saveSubscriptions(subscriptions: PushSubscription[]) {
  await ensureDataDirectory()
  await writeFile(SUBSCRIPTIONS_FILE, JSON.stringify({ subscriptions }, null, 2))
}

export async function POST(request: Request) {
  try {
    const subscription = await request.json()
    console.log('Neue Subscription erhalten:', subscription)
    
    const subscriptions = await getSubscriptions()
    subscriptions.push(subscription)
    await saveSubscriptions(subscriptions)
    
    console.log('Aktuelle Subscriptions:', subscriptions.length)
    return NextResponse.json({ message: 'Erfolgreich abonniert' })
  } catch (error) {
    console.error('Fehler beim Abonnieren:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abonnieren' },
      { status: 500 }
    )
  }
} 