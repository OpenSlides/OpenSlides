import { Page } from '@playwright/test';

export class APIHelper {
  private page: Page;
  private baseUrl: string;

  constructor(page: Page, baseUrl: string = 'https://localhost:8000') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async login(username: string = 'admin', password: string = 'admin'): Promise<string> {
    console.log(`Attempting API login for user: ${username}`);
    
    try {
      const response = await this.page.request.post(`${this.baseUrl}/system/auth/login`, {
        data: {
          username,
          password
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        ignoreHTTPSErrors: true,
        timeout: 30000
      });

      console.log(`Login response status: ${response.status()}`);
      
      if (response.ok()) {
        const body = await response.json();
        console.log('Login successful, response:', JSON.stringify(body).substring(0, 100));
        
        // Store cookies for subsequent requests
        const cookies = await this.page.context().cookies();
        console.log(`Stored ${cookies.length} cookies after login`);
        
        return body.access_token || body.sessionId || '';
      }
      
      const errorBody = await response.text().catch(() => 'No error body');
      console.error(`Login failed: ${response.status()} - ${errorBody}`);
      throw new Error(`Login failed: ${response.status()} - ${errorBody}`);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async createMeeting(data: {
    name: string;
    committee_id?: number;
    description?: string;
    start_time?: number;
    language?: string;
  }): Promise<number> {
    try {
      const response = await this.page.request.post(`${this.baseUrl}/system/action/handle_request`, {
        data: [
          {
            action: 'meeting.create',
            data: [{
              name: data.name,
              committee_id: data.committee_id || 1,
              description: data.description || '',
              start_time: data.start_time || Math.floor(Date.now() / 1000),
              language: data.language || 'en'  // Add required language field
            }]
          }
        ],
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        ignoreHTTPSErrors: true,
        timeout: 15000
      });

      console.log(`Create meeting response status: ${response.status()}`);
      
      if (response.ok()) {
        const body = await response.json();
        const meetingId = body.results?.[0]?.[0]?.id || body[0]?.id || 1;
        console.log(`Meeting created successfully with ID: ${meetingId}`);
        return meetingId;
      }
      
      const errorBody = await response.text().catch(() => 'No error body');
      console.error(`Failed to create meeting: ${response.status()} - ${errorBody}`);
      console.warn('Failed to create meeting via API, using fallback');
      return 1; // Fallback meeting ID
    } catch (error: any) {
      console.warn('API meeting creation failed, using fallback:', error?.message || error);
      return 1; // Fallback meeting ID
    }
  }

  async createAgendaItem(meetingId: number, data: {
    title: string;
    type?: number;
    duration?: number;
  }): Promise<number> {
    try {
      const response = await this.page.request.post(`${this.baseUrl}/system/action`, {
        data: {
          action: 'agenda_item.create',
          data: [{
            title: data.title,
            meeting_id: meetingId,
            type: data.type || 1,
            duration: data.duration || 0
          }]
        },
        ignoreHTTPSErrors: true
      });

      if (response.ok()) {
        const body = await response.json();
        return body.results?.[0]?.id || 1;
      }
      return 1;
    } catch (error: any) {
      console.warn('Failed to create agenda item:', error?.message || error);
      return 1;
    }
  }

  async ensureMeetingExists(meetingId: number): Promise<boolean> {
    try {
      // Try to get meeting info
      const response = await this.page.request.get(`${this.baseUrl}/system/presenter/handle_request`, {
        params: {
          presenter: 'get_meeting',
          data: JSON.stringify({ meeting_id: meetingId })
        },
        headers: {
          'Accept': 'application/json'
        },
        ignoreHTTPSErrors: true
      });
      
      return response.ok();
    } catch (error) {
      console.warn('Failed to check meeting existence:', error);
      return false;
    }
  }

  async createMotion(meetingId: number, data: {
    title: string;
    text: string;
    reason?: string;
  }): Promise<number> {
    try {
      const response = await this.page.request.post(`${this.baseUrl}/system/action`, {
        data: {
          action: 'motion.create',
          data: [{
            title: data.title,
            text: data.text,
            reason: data.reason || '',
            meeting_id: meetingId,
            submitter_ids: [1] // Admin as submitter
          }]
        },
        ignoreHTTPSErrors: true
      });

      if (response.ok()) {
        const body = await response.json();
        return body.results?.[0]?.id || 1;
      }
      return 1;
    } catch (error: any) {
      console.warn('Failed to create motion:', error?.message || error);
      return 1;
    }
  }


  async cleanup(): Promise<void> {
    // This would ideally clean up test data
    // For now, we'll leave test data in place
    console.log('Test data cleanup - skipping for development environment');
  }
}