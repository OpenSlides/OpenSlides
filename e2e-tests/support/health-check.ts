import { Page } from '@playwright/test';

export interface HealthCheckOptions {
  timeout?: number;
  retries?: number;
  services?: string[];
}

export interface ServiceStatus {
  name: string;
  healthy: boolean;
  responseTime?: number;
  error?: string;
}

export interface HealthCheckResult {
  overall: boolean;
  timestamp: string;
  services: ServiceStatus[];
  details?: any;
}

export class HealthCheck {
  private page: Page;
  private baseUrl: string;
  
  constructor(page: Page, baseUrl: string = 'https://localhost:8000') {
    this.page = page;
    this.baseUrl = baseUrl;
  }
  
  /**
   * Perform comprehensive health check of OpenSlides services
   */
  async checkHealth(options?: HealthCheckOptions): Promise<HealthCheckResult> {
    const opts = {
      timeout: options?.timeout || 30000,
      retries: options?.retries || 3,
      services: options?.services || [
        'client',
        'auth',
        'backend',
        'autoupdate',
        'presenter',
        'media'
      ]
    };
    
    console.log('Starting health check...');
    const startTime = Date.now();
    const results: ServiceStatus[] = [];
    
    // Check main application
    const mainAppStatus = await this.checkMainApp(opts.timeout);
    results.push(mainAppStatus);
    
    // Check individual services
    for (const service of opts.services) {
      const status = await this.checkService(service, opts.timeout);
      results.push(status);
    }
    
    // Check critical endpoints
    const criticalEndpoints = [
      { name: 'login-page', path: '/login', expectedStatus: 200 },
      { name: 'api-auth', path: '/system/auth', expectedStatus: [200, 405] },
      { name: 'api-action', path: '/system/action', expectedStatus: [200, 405] }
    ];
    
    for (const endpoint of criticalEndpoints) {
      const status = await this.checkEndpoint(
        endpoint.name,
        endpoint.path,
        endpoint.expectedStatus,
        opts.timeout
      );
      results.push(status);
    }
    
    const overallHealth = results.every(r => r.healthy);
    const totalTime = Date.now() - startTime;
    
    console.log(`Health check completed in ${totalTime}ms - Overall: ${overallHealth ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    return {
      overall: overallHealth,
      timestamp: new Date().toISOString(),
      services: results,
      details: {
        totalCheckTime: totalTime,
        baseUrl: this.baseUrl
      }
    };
  }
  
  /**
   * Check if main application is accessible
   */
  private async checkMainApp(timeout: number): Promise<ServiceStatus> {
    const name = 'main-app';
    const startTime = Date.now();
    
    try {
      const response = await this.page.request.get(this.baseUrl, {
        timeout,
        ignoreHTTPSErrors: true
      });
      
      const responseTime = Date.now() - startTime;
      const healthy = response.ok() || response.status() === 304;
      
      return {
        name,
        healthy,
        responseTime,
        error: healthy ? undefined : `Status ${response.status()}`
      };
    } catch (error: any) {
      return {
        name,
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error.message || 'Connection failed'
      };
    }
  }
  
  /**
   * Check individual service health
   */
  private async checkService(serviceName: string, timeout: number): Promise<ServiceStatus> {
    const serviceEndpoints: Record<string, string> = {
      'auth': '/system/auth',
      'backend': '/system/action/health',
      'presenter': '/system/presenter/health',
      'autoupdate': '/system/autoupdate/health',
      'media': '/system/media/health',
      'client': '/'
    };
    
    const endpoint = serviceEndpoints[serviceName] || `/system/${serviceName}`;
    const startTime = Date.now();
    
    try {
      const response = await this.page.request.get(`${this.baseUrl}${endpoint}`, {
        timeout,
        ignoreHTTPSErrors: true
      });
      
      const responseTime = Date.now() - startTime;
      // Some endpoints return 405 for GET requests which is expected
      const healthy = response.ok() || 
                     response.status() === 304 || 
                     response.status() === 405 ||
                     (serviceName === 'auth' && response.status() === 401);
      
      return {
        name: `service-${serviceName}`,
        healthy,
        responseTime,
        error: healthy ? undefined : `Status ${response.status()}`
      };
    } catch (error: any) {
      return {
        name: `service-${serviceName}`,
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error.message || 'Service unreachable'
      };
    }
  }
  
  /**
   * Check specific endpoint health
   */
  private async checkEndpoint(
    name: string,
    path: string,
    expectedStatus: number | number[],
    timeout: number
  ): Promise<ServiceStatus> {
    const startTime = Date.now();
    const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    
    try {
      const response = await this.page.request.get(`${this.baseUrl}${path}`, {
        timeout,
        ignoreHTTPSErrors: true
      });
      
      const responseTime = Date.now() - startTime;
      const healthy = expectedStatuses.includes(response.status());
      
      return {
        name,
        healthy,
        responseTime,
        error: healthy ? undefined : `Expected ${expectedStatuses.join('/')}, got ${response.status()}`
      };
    } catch (error: any) {
      return {
        name,
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error.message || 'Endpoint unreachable'
      };
    }
  }
  
  /**
   * Wait for services to be healthy
   */
  async waitForHealthy(options?: HealthCheckOptions & { maxWaitTime?: number }): Promise<boolean> {
    const maxWaitTime = options?.maxWaitTime || 120000; // 2 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();
    
    console.log('Waiting for services to become healthy...');
    
    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.checkHealth(options);
      
      if (result.overall) {
        console.log('All services are healthy!');
        return true;
      }
      
      const unhealthyServices = result.services
        .filter(s => !s.healthy)
        .map(s => s.name);
      
      console.log(`Waiting for unhealthy services: ${unhealthyServices.join(', ')}`);
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.error('Services did not become healthy within timeout period');
    return false;
  }
  
  /**
   * Generate health report
   */
  generateReport(result: HealthCheckResult): string {
    const lines = [
      '=== OpenSlides Health Check Report ===',
      `Timestamp: ${result.timestamp}`,
      `Overall Status: ${result.overall ? '✅ HEALTHY' : '❌ UNHEALTHY'}`,
      `Base URL: ${result.details?.baseUrl}`,
      `Total Check Time: ${result.details?.totalCheckTime}ms`,
      '',
      'Service Status:',
      '---------------'
    ];
    
    for (const service of result.services) {
      const status = service.healthy ? '✅' : '❌';
      const time = service.responseTime ? `(${service.responseTime}ms)` : '';
      const error = service.error ? ` - ${service.error}` : '';
      lines.push(`${status} ${service.name} ${time}${error}`);
    }
    
    lines.push('', '=== End of Health Check Report ===');
    
    return lines.join('\n');
  }
}