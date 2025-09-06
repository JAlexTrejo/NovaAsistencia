import { vi } from 'vitest';

// Mock environment variables for tests
vi?.mock('../lib/supabase', () => ({
  supabase: {
    from: vi?.fn(() => ({
      select: vi?.fn()?.mockReturnThis(),
      insert: vi?.fn()?.mockReturnThis(),
      update: vi?.fn()?.mockReturnThis(),
      delete: vi?.fn()?.mockReturnThis(),
      eq: vi?.fn()?.mockReturnThis(),
      single: vi?.fn()?.mockReturnThis(),
      order: vi?.fn()?.mockReturnThis()
    })),
    auth: {
      signInWithPassword: vi?.fn(),
      signUp: vi?.fn(),
      signOut: vi?.fn(),
      getSession: vi?.fn(),
      onAuthStateChange: vi?.fn()
    }
  }
}));

// Setup DOM globals
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi?.fn()?.mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi?.fn(),
    removeListener: vi?.fn(),
    addEventListener: vi?.fn(),
    removeEventListener: vi?.fn(),
    dispatchEvent: vi?.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi?.fn()?.mockImplementation((callback) => ({
  observe: vi?.fn(),
  unobserve: vi?.fn(),
  disconnect: vi?.fn()
}));