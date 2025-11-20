// src/app/buyer/page.tsx
import { redirect } from 'next/navigation';

export default function BuyerHomePage() {
  // For now just redirect to the requests list
  redirect('/buyer/requests');
}
