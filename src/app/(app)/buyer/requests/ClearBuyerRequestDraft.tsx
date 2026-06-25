'use client';

import { useEffect } from 'react';

import {
  BUYER_REQUEST_DRAFT_STORAGE_KEY,
  BUYER_REQUEST_SUBMITTED_STORAGE_KEY,
} from '@/lib/buyerRequestDraft';

export function ClearBuyerRequestDraft() {
  useEffect(() => {
    if (
      window.sessionStorage.getItem(BUYER_REQUEST_SUBMITTED_STORAGE_KEY) !== '1'
    ) {
      return;
    }

    window.localStorage.removeItem(BUYER_REQUEST_DRAFT_STORAGE_KEY);
    window.sessionStorage.removeItem(BUYER_REQUEST_SUBMITTED_STORAGE_KEY);
  }, []);

  return null;
}
