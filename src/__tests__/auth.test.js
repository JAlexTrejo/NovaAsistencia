// src/__tests__/auth.test.js
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

describe('Authentication Flows', () => {
  it('should successfully sign in with valid credentials', async () => {
    const mockResponse = {
      data: { user: { id: '123', email: 'test@example.com' }, session: {} },
      error: null,
    };
    supabase.auth.signInWithPassword.mockResolvedValue(mockResponse);

    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.data.user).toBeDefined();
    expect(result.data.user.email).toBe('test@example.com');
    expect(result.error).toBeNull();
  });

  it('should fail sign in with invalid credentials', async () => {
    const mockResponse = {
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    };
    supabase.auth.signInWithPassword.mockResolvedValue(mockResponse);

    const result = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    });

    expect(result.data.user).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Invalid credentials');
  });

  it('should successfully sign up a new user', async () => {
    const mockResponse = {
      data: { user: { id: '456', email: 'newuser@example.com' }, session: {} },
      error: null,
    };
    supabase.auth.signUp.mockResolvedValue(mockResponse);

    const result = await supabase.auth.signUp({
      email: 'newuser@example.com',
      password: 'password123',
    });

    expect(result.data.user).toBeDefined();
    expect(result.data.user.email).toBe('newuser@example.com');
    expect(result.error).toBeNull();
  });

  it('should successfully sign out', async () => {
    const mockResponse = { error: null };
    supabase.auth.signOut.mockResolvedValue(mockResponse);

    const result = await supabase.auth.signOut();

    expect(result.error).toBeNull();
  });

  it('should send password reset email', async () => {
    const mockResponse = { error: null };
    supabase.auth.resetPasswordForEmail.mockResolvedValue(mockResponse);

    const result = await supabase.auth.resetPasswordForEmail('test@example.com');

    expect(result.error).toBeNull();
  });

  it('should retrieve current session', async () => {
    const mockResponse = {
      data: { session: { user: { id: '123', email: 'test@example.com' } } },
      error: null,
    };
    supabase.auth.getSession.mockResolvedValue(mockResponse);

    const result = await supabase.auth.getSession();

    expect(result.data.session).toBeDefined();
    expect(result.data.session.user.email).toBe('test@example.com');
  });
});
