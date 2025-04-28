'use server'

import { revalidatePath } from 'next/cache'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { Announcement } from '@/lib/types'
import webpush from 'web-push'
import type { PushSubscription } from 'web-push'

const DATA_DIR = join(process.cwd(), 'src/data')
const ANNOUNCEMENTS_FILE = join(DATA_DIR, 'announcements.json')
const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscribers.json')

// VAPID-Schlüssel
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID-Schlüssel fehlen in den Umgebungsvariablen');
}

webpush.setVapidDetails(
  'mailto:vapid@hey.fansel.dev',
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

async function ensureAnnouncementsFile() {
  try {
    await readFile(ANNOUNCEMENTS_FILE)
  } catch {
    await writeFile(ANNOUNCEMENTS_FILE, JSON.stringify({ announcements: [] }, null, 2))
  }
}

async function sendNotification(message: string, type: string, group?: string) {
  try {
    // Lese die Subscriptions aus der Datei
    const subscriptionsData = await readFile(SUBSCRIPTIONS_FILE, 'utf-8')
    const { subscriptions } = JSON.parse(subscriptionsData)
    
    if (subscriptions.length === 0) {
      console.log('Keine aktiven Subscriptions gefunden')
      return
    }
    
    // Erstelle die Payload für die Push-Benachrichtigung
    const notificationPayload = {
      title: group ? `Neue Ankündigung von ${group}` : '',
      body: message,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      data: {
        url: '/',
        type: type
      }
    }
    
    // Sende die Push-Benachrichtigung an alle Subscriptions
    const promises = subscriptions.map(async (subscription: PushSubscription) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
      } catch (error) {
        console.error('Fehler beim Senden der Benachrichtigung:', error)
      }
    })
    
    await Promise.all(promises)
    console.log('Benachrichtigungen erfolgreich gesendet')
  } catch (error) {
    console.error('Fehler beim Senden der Benachrichtigungen:', error)
  }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    await ensureDataDirectory()
    await ensureAnnouncementsFile()
    
    const data = await readFile(ANNOUNCEMENTS_FILE, 'utf-8')
    const parsedData = JSON.parse(data)
    
    if (!parsedData.announcements || !Array.isArray(parsedData.announcements)) {
      throw new Error('Ungültiges JSON-Format')
    }
    
    return parsedData.announcements
  } catch (error) {
    console.error('Fehler beim Laden der Ankündigungen:', error)
    return []
  }
}

export async function saveAnnouncements(announcements: Announcement[]) {
  try {
    await ensureDataDirectory();
    await ensureAnnouncementsFile();
    
    if (!Array.isArray(announcements)) {
      throw new Error('Ungültiges Format');
    }
    
    // Speichere die Ankündigungen
    await writeFile(ANNOUNCEMENTS_FILE, JSON.stringify({ announcements }, null, 2));
    
    revalidatePath('/announcements');
    return { success: true };
  } catch {
    return { success: false, error: 'Interner Serverfehler' };
  }
}

export async function addAnnouncement(announcement: Announcement) {
  try {
    const announcements = await getAnnouncements()
    announcements.unshift(announcement)
    await saveAnnouncements(announcements)
    
    // Sende Push-Benachrichtigung mit Gruppenname
    await sendNotification(announcement.content, 'announcements', announcement.group)
    
    return { success: true }
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Ankündigung:', error)
    return { success: false, error: 'Interner Serverfehler' }
  }
}

export async function deleteAnnouncement(id: number) {
  try {
    const announcements = await getAnnouncements()
    const updatedAnnouncements = announcements.filter(a => a.id !== id)
    await saveAnnouncements(updatedAnnouncements)
    
    // Keine Push-Benachrichtigung beim Löschen
    return { success: true }
  } catch (error) {
    console.error('Fehler beim Löschen der Ankündigung:', error)
    return { success: false, error: 'Interner Serverfehler' }
  }
} 