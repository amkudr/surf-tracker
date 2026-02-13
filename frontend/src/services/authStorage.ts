const TOKEN_KEY = 'token';

export const getStoredToken = (): string | null => {
  const persistentToken = localStorage.getItem(TOKEN_KEY);
  if (persistentToken) {
    return persistentToken;
  }
  return sessionStorage.getItem(TOKEN_KEY);
};

export const storeToken = (token: string, rememberMe: boolean): void => {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }

  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};
