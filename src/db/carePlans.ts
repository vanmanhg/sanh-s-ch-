import { db } from './index.ts';
import { carePlans, careTasks } from './schema.ts';
import { eq, and, desc, asc, lte } from 'drizzle-orm';

export interface CreateCarePlanInput {
  userId: string;
  plantName: string;
  scientificName?: string;
  plantCategory?: string;
  location: string;
  sunlight: string;
  environmentNotes?: string;
  temperatureRange?: string;
  humidityLevel?: string;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  pruningFrequencyDays: number;
  pestCheckFrequencyDays: number;
  recommendedWaterAmount?: string;
  recommendedFertilizer?: string;
  pruningInstructions?: string;
  specialCareNotes?: string;
  notificationEnabled?: boolean;
  notificationTime?: string;
}

export async function createCarePlan(input: CreateCarePlanInput) {
  try {
    const [plan] = await db.insert(carePlans)
      .values({
        userId: input.userId,
        plantName: input.plantName,
        scientificName: input.scientificName || '',
        plantCategory: input.plantCategory || 'indoor',
        location: input.location,
        sunlight: input.sunlight,
        environmentNotes: input.environmentNotes || '',
        temperatureRange: input.temperatureRange || '22°C - 32°C',
        humidityLevel: input.humidityLevel || '60% - 80%',
        wateringFrequencyDays: input.wateringFrequencyDays || 3,
        fertilizingFrequencyDays: input.fertilizingFrequencyDays || 14,
        pruningFrequencyDays: input.pruningFrequencyDays || 30,
        pestCheckFrequencyDays: input.pestCheckFrequencyDays || 7,
        recommendedWaterAmount: input.recommendedWaterAmount || '500ml',
        recommendedFertilizer: input.recommendedFertilizer || 'Phân hữu cơ vi sinh / NPK loãng',
        pruningInstructions: input.pruningInstructions || 'Tỉa lá già, cành khô yếu',
        specialCareNotes: input.specialCareNotes || '',
        notificationEnabled: input.notificationEnabled ?? true,
        notificationTime: input.notificationTime || '07:30',
      })
      .returning();

    // Auto-generate initial upcoming tasks for this plan
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const initialTasks = [
      {
        planId: plan.id,
        userId: input.userId,
        taskType: 'water',
        title: `Tưới nước cho ${plan.plantName}`,
        description: `Lượng nước: ${plan.recommendedWaterAmount}. Tưới đẫm vào gốc, tránh đọng lá.`,
        scheduledDate: formatDate(new Date(today.getTime() + plan.wateringFrequencyDays * 86400000)),
        frequencyDays: plan.wateringFrequencyDays,
      },
      {
        planId: plan.id,
        userId: input.userId,
        taskType: 'fertilize',
        title: `Bón phân cho ${plan.plantName}`,
        description: `Loại phân: ${plan.recommendedFertilizer}. Bón khi đất ẩm.`,
        scheduledDate: formatDate(new Date(today.getTime() + plan.fertilizingFrequencyDays * 86400000)),
        frequencyDays: plan.fertilizingFrequencyDays,
      },
      {
        planId: plan.id,
        userId: input.userId,
        taskType: 'pest_check',
        title: `Kiểm tra sâu bệnh cho ${plan.plantName}`,
        description: 'Soi kỹ mặt dưới lá, kẽ cành xem có rệp sáp, bọ trĩ hay nấm đốm không.',
        scheduledDate: formatDate(new Date(today.getTime() + plan.pestCheckFrequencyDays * 86400000)),
        frequencyDays: plan.pestCheckFrequencyDays,
      },
      {
        planId: plan.id,
        userId: input.userId,
        taskType: 'prune',
        title: `Cắt tỉa & vệ sinh ${plan.plantName}`,
        description: plan.pruningInstructions || 'Cắt bỏ lá vàng héo, bấm ngọn kích thích phân nhánh.',
        scheduledDate: formatDate(new Date(today.getTime() + plan.pruningFrequencyDays * 86400000)),
        frequencyDays: plan.pruningFrequencyDays,
      },
    ];

    await db.insert(careTasks).values(initialTasks);

    return plan;
  } catch (error) {
    console.error('Error creating care plan:', error);
    throw new Error('Failed to create care plan in database.', { cause: error });
  }
}

export async function getUserCarePlans(userId: string) {
  try {
    return await db.select()
      .from(carePlans)
      .where(eq(carePlans.userId, userId))
      .orderBy(desc(carePlans.createdAt));
  } catch (error) {
    console.error('Error fetching care plans:', error);
    throw new Error('Failed to fetch care plans.', { cause: error });
  }
}

export async function getUserCareTasks(userId: string) {
  try {
    return await db.select({
      id: careTasks.id,
      planId: careTasks.planId,
      userId: careTasks.userId,
      taskType: careTasks.taskType,
      title: careTasks.title,
      description: careTasks.description,
      scheduledDate: careTasks.scheduledDate,
      frequencyDays: careTasks.frequencyDays,
      status: careTasks.status,
      completedAt: careTasks.completedAt,
      notes: careTasks.notes,
      createdAt: careTasks.createdAt,
      plantName: carePlans.plantName,
      location: carePlans.location,
    })
      .from(careTasks)
      .innerJoin(carePlans, eq(careTasks.planId, carePlans.id))
      .where(eq(careTasks.userId, userId))
      .orderBy(asc(careTasks.scheduledDate));
  } catch (error) {
    console.error('Error fetching care tasks:', error);
    throw new Error('Failed to fetch care tasks.', { cause: error });
  }
}

export async function completeCareTask(taskId: number, userId: string, notes?: string) {
  try {
    const now = new Date();
    const [updatedTask] = await db.update(careTasks)
      .set({
        status: 'completed',
        completedAt: now,
        notes: notes || 'Hoàn thành đúng lịch trình',
      })
      .where(and(eq(careTasks.id, taskId), eq(careTasks.userId, userId)))
      .returning();

    if (!updatedTask) return null;

    // Automatically schedule the NEXT occurrence based on frequencyDays!
    const nextDate = new Date(now.getTime() + updatedTask.frequencyDays * 86400000);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const [nextTask] = await db.insert(careTasks)
      .values({
        planId: updatedTask.planId,
        userId: updatedTask.userId,
        taskType: updatedTask.taskType,
        title: updatedTask.title,
        description: updatedTask.description,
        scheduledDate: nextDateStr,
        frequencyDays: updatedTask.frequencyDays,
        status: 'pending',
      })
      .returning();

    return { completed: updatedTask, next: nextTask };
  } catch (error) {
    console.error('Error completing care task:', error);
    throw new Error('Failed to complete care task.', { cause: error });
  }
}

export async function updateCarePlan(planId: number, userId: string, updates: Partial<CreateCarePlanInput>) {
  try {
    const [updated] = await db.update(carePlans)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(carePlans.id, planId), eq(carePlans.userId, userId)))
      .returning();
    return updated;
  } catch (error) {
    console.error('Error updating care plan:', error);
    throw new Error('Failed to update care plan.', { cause: error });
  }
}

export async function deleteCarePlan(planId: number, userId: string) {
  try {
    const [deleted] = await db.delete(carePlans)
      .where(and(eq(carePlans.id, planId), eq(carePlans.userId, userId)))
      .returning();
    return deleted;
  } catch (error) {
    console.error('Error deleting care plan:', error);
    throw new Error('Failed to delete care plan.', { cause: error });
  }
}
