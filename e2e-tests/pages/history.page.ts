import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class HistoryPage extends EnhancedBasePage {
  readonly historyButton: string;
  readonly historyList: string;
  readonly filterButton: string;
  readonly searchInput: string;
  readonly dateRangeStart: string;
  readonly dateRangeEnd: string;
  readonly userFilter: string;
  readonly actionFilter: string;
  readonly exportButton: string;
  readonly refreshButton: string;
  readonly detailsPanel: string;
  readonly liveMonitorToggle: string;

  constructor(page: Page) {
    super(page);
    this.historyButton = 'a[href*="/history"], mat-nav-list a:has-text("History")';
    this.historyList = '.history-list, [data-cy="history-entries"]';
    this.filterButton = 'button:has-text("Filter"), [data-cy="filter-history"]';
    this.searchInput = 'input[placeholder*="Search history"]';
    this.dateRangeStart = 'input[formcontrolname="start_date"]';
    this.dateRangeEnd = 'input[formcontrolname="end_date"]';
    this.userFilter = 'mat-select[formcontrolname="user"]';
    this.actionFilter = 'mat-select[formcontrolname="action_type"]';
    this.exportButton = 'button:has-text("Export"), [data-cy="export-history"]';
    this.refreshButton = 'button[mat-icon="refresh"]';
    this.detailsPanel = '.history-details, [data-cy="history-detail-panel"]';
    this.liveMonitorToggle = 'mat-slide-toggle[formcontrolname="live_monitoring"]';
  }

  async navigate(): Promise<void> {
    await this.click(this.historyButton, {
      waitForNetworkIdle: true
    });
  }

  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.click(this.filterButton, {
      waitForLoadState: true
    });
    await this.fill(this.dateRangeStart, startDate);
    await this.fill(this.dateRangeEnd, endDate);
    await this.click('button:has-text("Apply")', {
      waitForNetworkIdle: true
    });
  }

  async filterByUser(username: string): Promise<void> {
    await this.click(this.filterButton, {
      waitForLoadState: true
    });
    await this.click(this.userFilter);
    await this.click(`mat-option:has-text("${username}")`);
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async filterByActionType(actionType: string): Promise<void> {
    await this.click(this.filterButton);
    await this.click(this.actionFilter);
    await this.page.locator(`mat-option:has-text("${actionType}")`).click();
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async searchHistory(searchTerm: string): Promise<void> {
    await this.fill(this.searchInput, searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async viewEntryDetails(entryText: string): Promise<void> {
    const entry = this.historyList.locator(`text="${entryText}"`).first();
    await entry.click();
    await this.waitForSelector(this.detailsPanel, { state: 'visible' });
  }

  async exportHistory(options: {
    format: 'PDF' | 'CSV' | 'JSON';
    dateRange?: { start: string; end: string };
    includeAll?: boolean;
    anonymize?: boolean;
  }): Promise<void> {
    await this.click(this.exportButton);
    await this.page.waitForTimeout(500);
    
    await this.page.locator(`mat-radio-button:has-text("${options.format}")`).click();
    
    if (options.dateRange) {
      await this.page.fill('input[formcontrolname="export_start_date"]', options.dateRange.start);
      await this.page.fill('input[formcontrolname="export_end_date"]', options.dateRange.end);
    }
    
    if (options.anonymize) {
      await this.page.locator('mat-checkbox[formcontrolname="anonymize"]').click();
    }
    
    await this.page.locator('button:has-text("Export")').click();
    await this.page.waitForTimeout(3000);
  }

  async enableLiveMonitoring(): Promise<void> {
    const isEnabled = await this.liveMonitorToggle.getAttribute('aria-checked') === 'true';
    if (!isEnabled) {
      await this.click(this.liveMonitorToggle);
      await this.page.waitForTimeout(500);
    }
  }

  async getHistoryEntryCount(): Promise<number> {
    return await this.historyList.locator('.history-entry').count();
  }

  async getDetailedDiff(): Promise<{
    original: string;
    modified: string;
    added: string[];
    deleted: string[];
  }> {
    await this.waitForSelector(this.detailsPanel, { state: 'visible' });
    
    return {
      original: await this.detailsPanel.locator('.diff-original').textContent() || '',
      modified: await this.detailsPanel.locator('.diff-modified').textContent() || '',
      added: await this.detailsPanel.locator('.diff-added').allTextContents(),
      deleted: await this.detailsPanel.locator('.diff-deleted').allTextContents()
    };
  }

  async filterSecurityEvents(): Promise<void> {
    await this.click(this.filterButton);
    await this.page.locator('mat-checkbox:has-text("Security events only")').click();
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async analyzeRollback(entryId: string): Promise<void> {
    const entry = this.historyList.locator(`[data-entry-id="${entryId}"]`);
    await entry.hover();
    await entry.locator('button[mat-icon="undo"]').click();
    await this.page.waitForTimeout(1000);
  }

  async generateComplianceReport(reportType: string): Promise<void> {
    await this.page.locator('button:has-text("Compliance")').click();
    await this.page.locator(`mat-radio-button:has-text("${reportType}")`).click();
    await this.page.locator('button:has-text("Generate report")').click();
    await this.page.waitForTimeout(3000);
  }

  async configureRetention(policies: Array<{
    dataType: string;
    retentionPeriod: string;
  }>): Promise<void> {
    await this.page.locator('button:has-text("Settings")').click();
    await this.page.locator('mat-tab:has-text("Retention")').click();
    
    for (const policy of policies) {
      const row = this.page.locator(`tr:has-text("${policy.dataType}")`);
      await row.locator('input[formcontrolname="retention_period"]').fill(policy.retentionPeriod);
    }
    
    await this.page.locator('button:has-text("Save policies")').click();
    await this.page.waitForTimeout(2000);
  }

  async getActivitySummary(userId?: string): Promise<{
    totalActions: number;
    recentActions: string[];
    topActionTypes: Array<{ type: string; count: number }>;
  }> {
    if (userId) {
      await this.filterByUser(userId);
    }
    
    const totalActions = await this.getHistoryEntryCount();
    const recentActions = await this.historyList.locator('.history-entry').locator('.action-text').allTextContents();
    
    // This would need actual implementation to parse action types
    const topActionTypes: Array<{ type: string; count: number }> = [];
    
    return {
      totalActions,
      recentActions: recentActions.slice(0, 5),
      topActionTypes
    };
  }
}