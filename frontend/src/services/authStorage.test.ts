import { beforeEach, describe, expect, it } from 'vitest';
import { clearToken, getStoredToken, storeToken } from './authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores token in localStorage when rememberMe is true', () => {
    storeToken('persistent-token', true);

    expect(localStorage.getItem('token')).toBe('persistent-token');
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('stores token in sessionStorage when rememberMe is false', () => {
    storeToken('session-token', false);

    expect(sessionStorage.getItem('token')).toBe('session-token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('returns token from localStorage before sessionStorage', () => {
    sessionStorage.setItem('token', 'session-token');
    localStorage.setItem('token', 'persistent-token');

    expect(getStoredToken()).toBe('persistent-token');
  });

  it('clears token from both storages', () => {
    sessionStorage.setItem('token', 'session-token');
    localStorage.setItem('token', 'persistent-token');

    clearToken();

    expect(sessionStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
