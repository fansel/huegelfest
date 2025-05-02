'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/database/config/connector';
import { Announcement } from '@/database/models/Announcement';
import { Group } from '@/database/models/Group';
import { IMusic } from '@/database/models/Music';
import { IAnnouncement } from '@/types/announcement';
import { logger } from '@/server/lib/logger';
import { sendUpdateToAllClients } from '@/server/lib/sse';

// ... existing code ... 