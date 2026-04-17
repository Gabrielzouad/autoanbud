// src/app/actions/dealerCapabilities.ts
'use server';

import { createDealerCapability as createCapability, updateDealerCapability as updateCapability } from '@/lib/services/dealerCapabilities';
import { revalidatePath } from 'next/cache';

export async function createDealerCapability(data: any) {
  try {
    const result = await createCapability(data);
    revalidatePath('/dealer');
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create dealer capability:', error);
    return { success: false, error: 'Failed to save capabilities' };
  }
}

export async function updateDealerCapability(dealershipId: string, data: any) {
  try {
    const result = await updateCapability(dealershipId, data);
    revalidatePath('/dealer');
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update dealer capability:', error);
    return { success: false, error: 'Failed to update capabilities' };
  }
}