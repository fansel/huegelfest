import { connectDB } from '@/lib/db/connector';
import { Group } from '@/lib/db/models/Group';

export type GroupColors = Record<string, string>;

export async function getGroupColors(): Promise<GroupColors> {
  await connectDB();
  const groups = await Group.find();
  const groupColors: GroupColors = {};
  groups.forEach((group: any) => {
    groupColors[group.name] = group.color;
  });
  return groupColors;
}

export async function saveGroupColors(groupColors: GroupColors): Promise<{ success: boolean }> {
  await connectDB();
  for (const [name, color] of Object.entries(groupColors)) {
    await Group.findOneAndUpdate(
      { name },
      { name, color, updatedAt: new Date() },
      { upsert: true }
    );
  }
  return { success: true };
}

export async function updateGroupColor(name: string, color: string): Promise<{ success: boolean; error?: string }> {
  if (!name || !color) {
    return { success: false, error: 'Name und Farbe sind erforderlich' };
  }
  await connectDB();
  await Group.findOneAndUpdate(
    { name },
    { color, updatedAt: new Date() },
    { upsert: true }
  );
  return { success: true };
}

export async function getGroupsArray(): Promise<{ id: string; name: string; color: string }[]> {
  await connectDB();
  const groups = await Group.find();
  return groups.map((group: any) => ({
    id: group._id.toString(),
    name: group.name,
    color: group.color,
  }));
}

export async function createGroup(name: string, color: string): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!name || !color) {
    return { success: false, error: 'Name und Farbe sind erforderlich' };
  }
  await connectDB();
  const group = await Group.create({ name, color, createdAt: new Date(), updatedAt: new Date() });
  return { success: true, id: group._id.toString() };
}

export async function deleteGroup(id: string): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: 'ID ist erforderlich' };
  await connectDB();
  await Group.findByIdAndDelete(id);
  return { success: true };
}

export async function updateGroup(id: string, data: { name?: string; color?: string }): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: 'ID ist erforderlich' };
  await connectDB();
  const update: any = { updatedAt: new Date() };
  if (data.name) update.name = data.name;
  if (data.color) update.color = data.color;
  await Group.findByIdAndUpdate(id, update);
  return { success: true };
} 