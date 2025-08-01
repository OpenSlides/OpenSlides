import { Page } from '@playwright/test';
import { WaitHelpers } from './wait-helpers';

/**
 * Enhanced API helper for faster test data setup
 * Addresses API communication delays and test data initialization issues
 */
export class EnhancedAPIHelper {
  private page: Page;
  private baseUrl: string;
  private authToken?: string;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  /**
   * Login and get auth token for API calls
   * Caches token to avoid repeated logins
   */
  async ensureAuthenticated(username: string = 'admin', password: string = 'admin'): Promise<void> {
    if (this.authToken) return;

    try {
      // Try to get token from cookies
      const cookies = await this.page.context().cookies();
      const authCookie = cookies.find(c => c.name === 'AuthToken' || c.name === 'refreshId');
      
      if (authCookie) {
        this.authToken = authCookie.value;
        return;
      }

      // Login via API
      const response = await this.page.request.post(`${this.baseUrl}/system/auth/login`, {
        data: {
          username,
          password
        }
      });

      if (response.ok()) {
        const data = await response.json();
        this.authToken = data.token || data.access_token;
        
        // Set auth header for future requests
        await this.page.context().addCookies([{
          name: 'AuthToken',
          value: this.authToken,
          domain: new URL(this.baseUrl).hostname,
          path: '/'
        }]);
      }
    } catch (error) {
      console.warn('API authentication failed, will use UI login:', error);
    }
  }

  /**
   * Create meeting with retry and fallback
   * Fixes: API timeout issues
   */
  async createMeeting(name: string, retries: number = 3): Promise<number> {
    await this.ensureAuthenticated();

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.page.request.post(`${this.baseUrl}/api/meetings`, {
          data: {
            name,
            committee_id: 1,
            start_time: new Date().toISOString(),
            location: 'Test Location'
          },
          headers: this.getAuthHeaders(),
          timeout: 5000
        });

        if (response.ok()) {
          const data = await response.json();
          
          // Wait for autoupdate to propagate
          await WaitHelpers.waitForAutoupdate(this.page);
          
          return data.id || data.meeting_id;
        }
      } catch (error) {
        console.log(`Meeting creation attempt ${attempt + 1} failed:`, error);
        if (attempt < retries - 1) {
          await this.page.waitForTimeout(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed to create meeting "${name}" after ${retries} attempts`);
  }

  /**
   * Create agenda item with proper waits
   */
  async createAgendaItem(meetingId: number, title: string, data: any = {}): Promise<number> {
    await this.ensureAuthenticated();

    const response = await this.page.request.post(`${this.baseUrl}/api/meetings/${meetingId}/agenda-items`, {
      data: {
        title,
        type: 'common',
        duration: 300,
        ...data
      },
      headers: this.getAuthHeaders()
    });

    if (response.ok()) {
      const result = await response.json();
      await WaitHelpers.waitForAutoupdate(this.page);
      return result.id;
    }

    throw new Error(`Failed to create agenda item: ${response.status()}`);
  }

  /**
   * Create participant with proper waits
   */
  async createParticipant(meetingId: number, username: string, data: any = {}): Promise<number> {
    await this.ensureAuthenticated();

    const response = await this.page.request.post(`${this.baseUrl}/api/meetings/${meetingId}/participants`, {
      data: {
        username,
        first_name: data.firstName || username,
        last_name: data.lastName || 'User',
        email: data.email || `${username}@example.com`,
        group_ids: data.groupIds || [1]
      },
      headers: this.getAuthHeaders()
    });

    if (response.ok()) {
      const result = await response.json();
      await WaitHelpers.waitForAutoupdate(this.page);
      return result.id;
    }

    throw new Error(`Failed to create participant: ${response.status()}`);
  }

  /**
   * Batch create test data
   * Optimizes multiple entity creation
   */
  async createTestData(data: {
    meetings?: Array<{ name: string; committeeId?: number }>;
    agendaItems?: Array<{ meetingId: number; title: string }>;
    participants?: Array<{ meetingId: number; username: string }>;
  }): Promise<void> {
    await this.ensureAuthenticated();

    // Create meetings in parallel
    if (data.meetings) {
      await Promise.all(
        data.meetings.map(meeting => 
          this.createMeeting(meeting.name).catch(err => 
            console.warn(`Failed to create meeting ${meeting.name}:`, err)
          )
        )
      );
    }

    // Create agenda items in parallel
    if (data.agendaItems) {
      await Promise.all(
        data.agendaItems.map(item => 
          this.createAgendaItem(item.meetingId, item.title).catch(err => 
            console.warn(`Failed to create agenda item ${item.title}:`, err)
          )
        )
      );
    }

    // Create participants in parallel
    if (data.participants) {
      await Promise.all(
        data.participants.map(participant => 
          this.createParticipant(participant.meetingId, participant.username).catch(err => 
            console.warn(`Failed to create participant ${participant.username}:`, err)
          )
        )
      );
    }

    // Wait for all data to propagate
    await WaitHelpers.waitForAutoupdate(this.page);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for specific entity to exist
   */
  async waitForEntity(entityType: string, identifier: string, timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const exists = await this.checkEntityExists(entityType, identifier);
        if (exists) return true;
        
        await this.page.waitForTimeout(500);
      } catch {
        // Continue waiting
      }
    }
    
    return false;
  }

  /**
   * Check if entity exists via API
   */
  private async checkEntityExists(entityType: string, identifier: string): Promise<boolean> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.page.request.get(`${this.baseUrl}/api/${entityType}s?name=${identifier}`, {
        headers: this.getAuthHeaders()
      });
      
      if (response.ok()) {
        const data = await response.json();
        return data.results?.length > 0 || data.data?.length > 0;
      }
    } catch {
      return false;
    }
    
    return false;
  }

  /**
   * Get auth headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  /**
   * Clear test data after scenario
   */
  async clearTestData(meetingIds: number[]): Promise<void> {
    await this.ensureAuthenticated();
    
    // Delete meetings in parallel
    await Promise.all(
      meetingIds.map(id => 
        this.page.request.delete(`${this.baseUrl}/api/meetings/${id}`, {
          headers: this.getAuthHeaders()
        }).catch(() => {})
      )
    );
  }
}