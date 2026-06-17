function createTokenStore() {
  let accessToken: string | null = null;

  return {
    get: (): string | null => {
      if (typeof window === "undefined") return null;
      return accessToken;
    },
    set: (token: string | null) => {
      if (typeof window === "undefined") return;
      accessToken = token;
    },
    clear: () => {
      if (typeof window === "undefined") return;
      accessToken = null;
    },
  };
}

export const tokenStore = createTokenStore();
