import { Page, BrowserContext } from '@playwright/test';
import axios from 'axios';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  userId: number;
}

export class AuthHelper {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Login via API and get tokens
   */
  async loginViaAPI(username: string, password: string): Promise<AuthTokens> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/system/auth/login`,
        { username, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false // Accept self-signed certificates
          })
        }
      );

      // Extract tokens from response
      const authHeader = response.headers['authentication'];
      const setCookieHeader = response.headers['set-cookie'];
      
      if (!authHeader) {
        throw new Error('No authentication header in response');
      }

      // Parse access token from Authentication header
      const accessToken = authHeader.replace('bearer ', '');
      
      // Parse refresh token from Set-Cookie header
      let refreshToken = '';
      if (setCookieHeader) {
        const refreshCookie = Array.isArray(setCookieHeader) 
          ? setCookieHeader.find(c => c.includes('refreshId'))
          : setCookieHeader;
        
        if (refreshCookie) {
          const match = refreshCookie.match(/refreshId=([^;]+)/);
          if (match) {
            refreshToken = decodeURIComponent(match[1]).replace('bearer ', '');
          }
        }
      }

      // Decode JWT to get session info
      const tokenPayload = this.decodeJWT(accessToken);
      
      return {
        accessToken,
        refreshToken,
        sessionId: tokenPayload.sessionId,
        userId: tokenPayload.userId
      };
    } catch (error: any) {
      console.error('API login failed:', error.response?.data || error.message);
      throw new Error(`Failed to login via API: ${error.message}`);
    }
  }

  /**
   * Set authentication tokens in browser context
   */
  async setAuthInBrowser(context: BrowserContext, tokens: AuthTokens): Promise<void> {
    // Set cookies for the domain
    await context.addCookies([
      {
        name: 'refreshId',
        value: `bearer ${tokens.refreshToken}`,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      },
      {
        name: 'sessionId',
        value: tokens.sessionId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax'
      }
    ]);

    // Set localStorage/sessionStorage via page context
    await context.addInitScript((tokens) => {
      // Store auth data in localStorage
      localStorage.setItem('auth_token', tokens.accessToken);
      localStorage.setItem('access_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
      localStorage.setItem('session_id', tokens.sessionId);
      localStorage.setItem('user_id', tokens.userId.toString());
      
      // Some apps use sessionStorage
      sessionStorage.setItem('auth_token', tokens.accessToken);
      sessionStorage.setItem('access_token', tokens.accessToken);
      
      // OpenSlides might use a specific key pattern
      localStorage.setItem('OpenSlides:auth:access_token', tokens.accessToken);
      localStorage.setItem('OpenSlides:auth:refresh_token', tokens.refreshToken);
      localStorage.setItem('OpenSlides:auth:user_id', tokens.userId.toString());
    }, tokens);
  }

  /**
   * Authenticate a page directly without UI login
   */
  async authenticatePage(page: Page, username: string, password: string): Promise<void> {
    const context = page.context();
    
    // Get tokens via API
    console.log(`Authenticating ${username} via API...`);
    const tokens = await this.loginViaAPI(username, password);
    console.log('Got authentication tokens');
    
    // Set tokens in browser
    await this.setAuthInBrowser(context, tokens);
    
    // Navigate to authenticated area
    await page.goto(`${this.baseUrl}/`, {
      waitUntil: 'domcontentloaded'
    });
    
    // Verify authentication worked
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Authentication failed - redirected to login');
    }
    
    console.log(`Successfully authenticated as ${username}`);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(page: Page): Promise<boolean> {
    // Check URL
    if (page.url().includes('/login')) {
      return false;
    }
    
    // Check for auth token in localStorage
    const hasToken = await page.evaluate(() => {
      return !!(
        localStorage.getItem('auth_token') || 
        localStorage.getItem('access_token') ||
        localStorage.getItem('OpenSlides:auth:access_token')
      );
    });
    
    return hasToken;
  }

  /**
   * Logout by clearing auth data
   */
  async logout(context: BrowserContext): Promise<void> {
    // Clear cookies
    await context.clearCookies();
    
    // Clear storage
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Decode JWT token
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64').toString().split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return {};
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshAuth(context: BrowserContext, refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/system/auth/refresh`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `bearer ${refreshToken}`
          },
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        }
      );

      const authHeader = response.headers['authentication'];
      const newAccessToken = authHeader.replace('bearer ', '');
      const tokenPayload = this.decodeJWT(newAccessToken);

      const tokens: AuthTokens = {
        accessToken: newAccessToken,
        refreshToken: refreshToken, // Usually stays the same
        sessionId: tokenPayload.sessionId,
        userId: tokenPayload.userId
      };

      await this.setAuthInBrowser(context, tokens);
      return tokens;
    } catch (error: any) {
      console.error('Token refresh failed:', error.message);
      throw error;
    }
  }
}