import { Page, Locator } from '@playwright/test';

export class HistoryPage {
  readonly page: Page;
  readonly historyButton: Locator;
  readonly historyList: Locator;
  readonly filterButton: Locator;
  readonly searchInput: Locator;
  readonly dateRangeStart: Locator;
  readonly dateRangeEnd: Locator;
  readonly userFilter: Locator;
  readonly actionFilter: Locator;
  readonly exportButton: Locator;
  readonly refreshButton: Locator;
  readonly detailsPanel: Locator;
  readonly liveMonitorToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.historyButton = page.locator('a[href*="/history"], mat-nav-list a:has-text("History")');
    this.historyList = page.locator('.history-list, [data-cy="history-entries"]');
    this.filterButton = page.locator('button:has-text("Filter"), [data-cy="filter-history"]');
    this.searchInput = page.locator('input[placeholder*="Search history"]');
    this.dateRangeStart = page.locator('input[formcontrolname="start_date"]');
    this.dateRangeEnd = page.locator('input[formcontrolname="end_date"]');
    this.userFilter = page.locator('mat-select[formcontrolname="user"]');
    this.actionFilter = page.locator('mat-select[formcontrolname="action_type"]');
    this.exportButton = page.locator('button:has-text("Export"), [data-cy="export-history"]');
    this.refreshButton = page.locator('button[mat-icon="refresh"]');
    this.detailsPanel = page.locator('.history-details, [data-cy="history-detail-panel"]');
    this.liveMonitorToggle = page.locator('mat-slide-toggle[formcontrolname="live_monitoring"]');
  }

  async navigate(): Promise<void> {
    await this.historyButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.filterButton.click();
    await this.dateRangeStart.fill(startDate);
    await this.dateRangeEnd.fill(endDate);
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async filterByUser(username: string): Promise<void> {
    await this.filterButton.click();
    await this.userFilter.click();
    await this.page.locator(`mat-option:has-text("${username}")`).click();
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async filterByActionType(actionType: string): Promise<void> {
    await this.filterButton.click();
    await this.actionFilter.click();
    await this.page.locator(`mat-option:has-text("${actionType}")`).click();
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async searchHistory(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async viewEntryDetails(entryText: string): Promise<void> {
    const entry = this.historyList.locator(`text="${entryText}"`).first();
    await entry.click();
    await this.detailsPanel.waitFor({ state: 'visible' });
  }

  async exportHistory(options: {
    format: 'PDF' | 'CSV' | 'JSON';
    dateRange?: { start: string; end: string };
    includeAll?: boolean;
    anonymize?: boolean;
  }): Promise<void> {
    await this.exportButton.click();
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
      await this.liveMonitorToggle.click();
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
    await this.detailsPanel.waitFor({ state: 'visible' });
    
    return {
      original: await this.detailsPanel.locator('.diff-original').textContent() || '',
      modified: await this.detailsPanel.locator('.diff-modified').textContent() || '',
      added: await this.detailsPanel.locator('.diff-added').allTextContents(),
      deleted: await this.detailsPanel.locator('.diff-deleted').allTextContents()
    };
  }

  async filterSecurityEvents(): Promise<void> {
    await this.filterButton.click();
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