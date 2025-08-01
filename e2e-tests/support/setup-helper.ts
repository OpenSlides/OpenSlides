import axios, { AxiosInstance } from 'axios';
import https from 'https';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
}

export class SetupHelper {
  private api: AxiosInstance;
  private tokens?: AuthTokens;

  constructor(private baseUrl: string = 'https://localhost:8000') {
    this.api = axios.create({
      baseURL: baseUrl,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  async login(username: string = 'admin', password: string = 'admin'): Promise<AuthTokens> {
    try {
      const response = await this.api.post('/system/auth/login', {
        username,
        password
      });

      this.tokens = {
        accessToken: response.data.access_token || '',
        refreshToken: response.data.refresh_token,
        sessionId: response.data.session_id
      };

      // Set auth header for subsequent requests
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.tokens.accessToken}`;
      
      if (response.headers['set-cookie']) {
        const cookies = response.headers['set-cookie'];
        const cookieString = cookies.join('; ');
        this.api.defaults.headers.common['Cookie'] = cookieString;
      }

      return this.tokens;
    } catch (error: any) {
      throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getOrCreateDefaultCommittee(): Promise<number> {
    try {
      // First try to get existing committees using presenter
      const response = await this.api.post('/system/presenter/handle_request', {
        presenter: 'get_committees',
        data: {}
      });

      if (response.data?.length > 0) {
        // Return first committee ID
        return response.data[0].id;
      }
    } catch (error) {
      console.log('Could not get committees using presenter');
    }

    // Try to get committee 1 (default)
    try {
      const checkResponse = await this.api.get('/system/presenter/handle_request', {
        params: {
          presenter: 'get_committee',
          data: JSON.stringify({ committee_id: 1 })
        }
      });
      
      if (checkResponse.data) {
        console.log('Using existing committee 1');
        return 1;
      }
    } catch (error) {
      // Committee 1 doesn't exist, create it
    }

    // Get organization ID first
    const orgId = await this.getOrganizationId();
    
    // Create committee
    return await this.createCommittee({ 
      name: 'Default Committee',
      description: 'Default committee for E2E tests',
      organization_id: orgId
    });
  }

  async getOrganizationId(): Promise<number> {
    try {
      const response = await this.api.get('/system/presenter/handle_request', {
        params: {
          presenter: 'get_organization',
          data: JSON.stringify({})
        }
      });
      
      return response.data?.id || 1;
    } catch (error) {
      // Default to organization 1
      return 1;
    }
  }

  async createCommittee(data: {
    name: string;
    description?: string;
    organization_id?: number;
  }): Promise<number> {
    try {
      const response = await this.api.post('/system/action/handle_request', [
        {
          action: 'committee.create',
          data: [{
            name: data.name,
            description: data.description || '',
            organization_id: data.organization_id || 1,
            // Ensure admin has management permissions
            manager_ids: [1], // Admin user ID
            user_$_management_level: {
              1: 'can_manage' // Give admin full management rights
            }
          }]
        }
      ]);

      return response.data.results[0][0].id;
    } catch (error: any) {
      throw new Error(`Failed to create committee: ${error.response?.data?.message || error.message}`);
    }
  }

  async ensureTestSetup(): Promise<{
    committeeId: number;
    meetingId: number;
  }> {
    // Login first
    await this.login();

    // Get or create committee
    const committeeId = await this.getOrCreateDefaultCommittee();

    // Create a test meeting
    const meetingId = await this.createMeeting({
      name: 'Board Meeting',
      committee_id: committeeId,
      description: 'E2E Test Meeting',
      language: 'en'
    });

    return { committeeId, meetingId };
  }

  async createMeeting(data: {
    name: string;
    committee_id: number;
    description?: string;
    language?: string;
  }): Promise<number> {
    try {
      const response = await this.api.post('/system/action/handle_request', [
        {
          action: 'meeting.create',
          data: [{
            name: data.name,
            committee_id: data.committee_id,
            description: data.description || '',
            language: data.language || 'en',
            // Ensure admin has rights in the meeting
            admin_group_id: 1,
            default_group_id: 2
          }]
        }
      ]);

      return response.data.results[0][0].id;
    } catch (error: any) {
      throw new Error(`Failed to create meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  async createAgendaItem(meetingId: number, data: {
    title: string;
    type?: string;
    duration?: number;
    comment?: string;
  }): Promise<number> {
    try {
      const response = await this.api.post('/system/action/handle_request', [
        {
          action: 'agenda_item.create',
          data: [{
            meeting_id: meetingId,
            title: data.title,
            type: data.type === 'common' ? 1 : data.type === 'internal' ? 2 : 3,
            duration: data.duration || 0,
            comment: data.comment || ''
          }]
        }
      ]);

      return response.data.results[0][0].id;
    } catch (error: any) {
      throw new Error(`Failed to create agenda item: ${error.response?.data?.message || error.message}`);
    }
  }
}