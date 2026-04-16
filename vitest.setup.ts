import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.POSTGRES_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Next.js modules
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));
