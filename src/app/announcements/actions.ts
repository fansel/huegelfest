'use server'

import { revalidatePath } from 'next/cache'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { Announcement } from '@/lib/types'
import webpush from 'web-push'

const DATA_DIR = join(process.cwd(), 'src/data')
const ANNOUNCEMENTS_FILE = join(DATA_DIR, 'announcements.json')
const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscribers.json')

// VAPID-Schlüssel
const NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BGaY-2eeg8pi2yNRIsLdm4SN4RmHTKdVwaeEdZeUpJSMv9isl12K0TadiH9GDDWo96r7OFFMPdurXoSEiu0nnH4'
const VAPID_PRIVATE_KEY = '19N-DzH4SjTHGvhapCSm3o61V0iGaqJu6zGWvJ5zrsI'

webpush.setVapidDetails(
  'mailto:info@huegelfest.de',
  NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
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

async function sendNotification(message: string, type: string) {
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
      title: '',
      body: message,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      data: {
        url: '/',
        type: type
      }
    }
    
    // Sende die Push-Benachrichtigung an alle Subscriptions
    const promises = subscriptions.map(async (subscription: any) => {
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
    
    await writeFile(ANNOUNCEMENTS_FILE, JSON.stringify({ announcements }, null, 2));
    
    // Sende Push-Benachrichtigung für die neueste Ankündigung
    if (announcements.length > 0) {
      const latestAnnouncement = announcements[announcements.length - 1];
      await sendNotification(latestAnnouncement.content, 'infoboard');
    }
    
    revalidatePath('/announcements');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Interner Serverfehler' };
  }
}

export async function addAnnouncement(announcement: Announcement) {
  try {
    const announcements = await getAnnouncements()
    announcements.unshift(announcement)
    await saveAnnouncements(announcements)
    
    // Sende Push-Benachrichtigung
    await sendNotification(announcement.content, 'announcements')
    
    return { success: true }
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Ankündigung:', error)
    return { success: false, error: 'Interner Serverfehler' }
  }
} 