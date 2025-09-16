import { vi } from 'vitest';

// Mock electron app module for testing
vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn((name: string) => {
      const paths = {
        userData: '/mock/userData',
        documents: '/mock/documents'
      };
      return paths[name as keyof typeof paths] || '/mock/default';
    })
  }
}));

// Mock fs/promises module
vi.mock('fs/promises');
