
interface Tokens {
    access: string;
    refresh: string;
}

class TokenService {
    setTokens(tokens: Tokens): void {
        localStorage.setItem("tokens", JSON.stringify(tokens));
    }

    getTokens(): Tokens | null {
        const tokens = localStorage.getItem("tokens");
        return tokens ? JSON.parse(tokens) : null;
    }

    getAccessToken(): string | null {
        const tokens = this.getTokens();
        return tokens ? tokens.access : null;
    }

    getRefreshToken(): string | null {
        const tokens = this.getTokens();
        return tokens ? tokens.refresh : null;
    }

    clearTokens(): void {
        localStorage.removeItem("tokens");
    }
}

export default new TokenService();