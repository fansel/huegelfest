import { NextResponse } from 'next/server'
import { connectDB } from '@/database/config/connector'
import { Subscriber } from '@/database/models/Subscriber'

export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json()
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint fehlt' },
        { status: 400 }
      )
    }

    await connectDB()

    // Entferne den Subscriber
    await Subscriber.deleteOne({ endpoint })

    return NextResponse.json({ message: 'Erfolgreich abbestellt' })
  } catch (error) {
    console.error('Fehler beim Abbestellen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 