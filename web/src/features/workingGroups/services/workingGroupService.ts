import { connectDB } from '@/lib/db/connector';
import { WorkingGroup } from '@/lib/db/models/WorkingGroup';

export type WorkingGroupColors = Record<string, string>;

export async function getWorkingGroupColors(): Promise<WorkingGroupColors> {
  await connectDB();
  const workingGroups = await WorkingGroup.find();
  const workingGroupColors: WorkingGroupColors = {};
  workingGroups.forEach((workingGroup: any) => {
    workingGroupColors[workingGroup.name] = workingGroup.color;
  });
  return workingGroupColors;
}

export async function saveWorkingGroupColors(workingGroupColors: WorkingGroupColors): Promise<{ success: boolean }> {
  await connectDB();
  for (const [name, color] of Object.entries(workingGroupColors)) {
    await WorkingGroup.findOneAndUpdate(
      { name },
      { name, color, updatedAt: new Date() },
      { upsert: true }
    );
  }
  return { success: true };
}

export async function updateWorkingGroupColor(name: string, color: string): Promise<{ success: boolean; error?: string }> {
  if (!name || !color) {
    return { success: false, error: 'Name und Farbe sind erforderlich' };
  }
  await connectDB();
  await WorkingGroup.findOneAndUpdate(
    { name },
    { color, updatedAt: new Date() },
    { upsert: true }
  );
  return { success: true };
}

export async function getWorkingGroupsArray(): Promise<{ id: string; name: string; color: string }[]> {
  await connectDB();
  const workingGroups = await WorkingGroup.find();
  return workingGroups.map((workingGroup: any) => ({
    id: workingGroup._id.toString(),
    name: workingGroup.name,
    color: workingGroup.color,
  }));
}

export async function createWorkingGroup(name: string, color: string): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!name || !color) {
    return { success: false, error: 'Name und Farbe sind erforderlich' };
  }
  await connectDB();
  const workingGroup = await WorkingGroup.create({ name, color, createdAt: new Date(), updatedAt: new Date() });
  return { success: true, id: workingGroup._id.toString() };
}

export async function deleteWorkingGroup(id: string): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: 'ID ist erforderlich' };
  await connectDB();
  await WorkingGroup.findByIdAndDelete(id);
  return { success: true };
}

export async function updateWorkingGroup(id: string, data: { name?: string; color?: string }): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: 'ID ist erforderlich' };
  await connectDB();
  const update: any = { updatedAt: new Date() };
  if (data.name) update.name = data.name;
  if (data.color) update.color = data.color;
  await WorkingGroup.findByIdAndUpdate(id, update);
  return { success: true };
} 