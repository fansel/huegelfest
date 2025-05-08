import { connectDB } from '@/database/config/apiConnector';

export async function checkHealth() {
  try {
    await connectDB();
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: 'Database connection failed' };
  }
} 