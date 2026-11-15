import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email?: string, displayName?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email: email || '',
        displayName: displayName || '',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || '',
          displayName: displayName || '',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
