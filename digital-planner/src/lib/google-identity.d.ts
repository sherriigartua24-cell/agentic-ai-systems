// Minimal ambient types for the Google Identity Services (GIS) client script,
// which is loaded at runtime via a <script> tag rather than npm.
export {}

declare global {
  const google: {
    accounts: {
      oauth2: {
        initTokenClient(config: {
          client_id: string
          scope: string
          callback: (response: google.accounts.oauth2.TokenResponse) => void
        }): google.accounts.oauth2.TokenClient
        revoke(accessToken: string, done: () => void): void
      }
    }
  }

  namespace google.accounts.oauth2 {
    interface TokenResponse {
      access_token: string
      expires_in: number
      error?: string
    }

    interface TokenClient {
      callback: (response: TokenResponse) => void
      requestAccessToken(options?: { prompt?: string }): void
    }
  }
}
