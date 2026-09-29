import { describe, it, expect } from 'vitest';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';

describe('OptionalJwtAuthGuard', () => {
  const guard = new OptionalJwtAuthGuard();

  it('should return user if user is present and no error', () => {
    const mockUser = { id: 'user-123', username: 'gabriel' };
    const result = guard.handleRequest(null, mockUser);
    expect(result).toEqual(mockUser);
  });

  it('should return null if there is an error', () => {
    const result = guard.handleRequest(new Error('Invalid token'), null);
    expect(result).toBeNull();
  });

  it('should return null if user is undefined or null', () => {
    const result = guard.handleRequest(null, null);
    expect(result).toBeNull();
  });
});
