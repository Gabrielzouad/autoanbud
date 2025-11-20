// src/app/dealer/page.tsx
import { redirect } from 'next/navigation';

export default function DealerHomePage() {
  redirect('/dealer/requests');
}
