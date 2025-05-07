import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/auth/auth';
import { User } from '@/database/models/User';
import { connectDB } from '@/database/config/apiConnector';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const payload = await verifyToken(token.value);
    if (!payload) {
      return NextResponse.json({ isAuthenticated: false });
    }

    await connectDB();
    const user = await User.findOne({ username: payload.username });
    if (!user) {
      return NextResponse.json({ isAuthenticated: false });
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user._id.toString(),
        name: user.username,
        isAdmin: user.role === 'admin'
      }
    });
  } catch (error) {
    console.error('Auth-Check-Fehler:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
} 