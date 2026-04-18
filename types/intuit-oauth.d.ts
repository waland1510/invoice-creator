declare module 'intuit-oauth' {
  class OAuthClient {
    constructor(config: {
      clientId: string;
      clientSecret: string;
      environment: string;
      redirectUri: string;
      token?: any;
      logging?: boolean;
    });

    authorizeUri(options: { scope: any[]; state: string }): string;
    createToken(url: string): Promise<any>;
    getToken(): { token: any };
    setToken(token: any): void;
    makeApiCall(options: { url: string; method: string; headers?: any; body?: string }): Promise<any>;

    static scopes: {
      Accounting: string;
      Payment: string;
      OpenId: string;
    };
  }

  export = OAuthClient;
}
