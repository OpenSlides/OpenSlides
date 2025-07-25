import { Page, Locator } from '@playwright/test';
import * as path from 'path';

export class FilePage {
  readonly page: Page;
  readonly uploadButton: Locator;
  readonly fileList: Locator;
  readonly fileInput: Locator;
  readonly descriptionInput: Locator;
  readonly createFolderButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly downloadButton: Locator;
  readonly deleteButton: Locator;
  readonly moveButton: Locator;
  readonly tagInput: Locator;
  readonly projectButton: Locator;
  readonly previewModal: Locator;
  readonly versionHistoryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.uploadButton = page.locator('button:has-text("Upload"), [data-cy="upload-file"]');
    this.fileList = page.locator('.file-list, [class*="file-item"], mat-card');
    this.fileInput = page.locator('input[type="file"]');
    this.descriptionInput = page.locator('textarea[formcontrolname="description"], input[placeholder*="description"]');
    this.createFolderButton = page.locator('button:has-text("New folder"), button:has-text("Create folder")');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search files"]');
    this.filterButton = page.locator('button:has-text("Filter"), [data-cy="filter-files"]');
    this.downloadButton = page.locator('button:has-text("Download")');
    this.deleteButton = page.locator('button:has-text("Delete")');
    this.moveButton = page.locator('button:has-text("Move")');
    this.tagInput = page.locator('input[formcontrolname="tags"], mat-chip-input');
    this.projectButton = page.locator('button:has-text("Project")');
    this.previewModal = page.locator('.file-preview, mat-dialog-container');
    this.versionHistoryButton = page.locator('button:has-text("Version history")');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/files');
    await this.page.waitForLoadState('networkidle');
  }

  async uploadFile(filePath: string, description?: string): Promise<void> {
    await this.uploadButton.click();
    await this.page.waitForTimeout(500);
    
    await this.fileInput.setInputFiles(filePath);
    
    if (description) {
      await this.descriptionInput.fill(description);
    }
    
    await this.page.locator('button:has-text("Upload")').click();
    
    // Wait for upload to complete
    await this.page.waitForSelector('.upload-progress', { state: 'hidden', timeout: 30000 });
  }

  async uploadMultipleFiles(filePaths: string[]): Promise<void> {
    await this.uploadButton.click();
    await this.page.waitForTimeout(500);
    
    await this.fileInput.setInputFiles(filePaths);
    
    await this.page.locator('button:has-text("Upload all")').click();
    
    // Wait for all uploads to complete
    await this.page.waitForSelector('.upload-progress', { state: 'hidden', timeout: 60000 });
  }

  async createFolder(folderName: string): Promise<void> {
    await this.createFolderButton.click();
    await this.page.waitForTimeout(500);
    
    const folderNameInput = this.page.locator('input[formcontrolname="folder_name"], input[placeholder*="Folder name"]');
    await folderNameInput.fill(folderName);
    
    await this.page.locator('button:has-text("Create")').click();
    await this.page.waitForTimeout(2000);
  }

  async moveFilesToFolder(fileNames: string[], folderName: string): Promise<void> {
    // Select files
    for (const fileName of fileNames) {
      await this.page.locator(`mat-checkbox:near(:text("${fileName}")), input[type="checkbox"]:near(:text("${fileName}"))`).click();
    }
    
    await this.moveButton.click();
    await this.page.waitForTimeout(500);
    
    // Select target folder
    await this.page.locator(`mat-tree-node:has-text("${folderName}"), .folder-item:has-text("${folderName}")`).click();
    
    await this.page.locator('button:has-text("Move here")').click();
    await this.page.waitForTimeout(2000);
  }

  async setFileVisibility(fileName: string, visibility: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.page.locator('button:has-text("Properties"), button:has-text("Edit")').click();
    await this.page.waitForTimeout(500);
    
    await this.page.locator('mat-select[formcontrolname="visibility"]').click();
    await this.page.locator(`mat-option:has-text("${visibility}")`).click();
    
    await this.page.locator('button:has-text("Save")').click();
    await this.page.waitForTimeout(2000);
  }

  async linkFileToAgendaItem(fileName: string, agendaItemTitle: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.page.locator('button:has-text("Link to agenda")').click();
    await this.page.waitForTimeout(500);
    
    await this.page.locator(`mat-option:has-text("${agendaItemTitle}")`).click();
    
    await this.page.locator('button:has-text("Link")').click();
    await this.page.waitForTimeout(2000);
  }

  async uploadNewVersion(fileName: string, newVersionPath: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.page.locator('button:has-text("Upload new version")').click();
    await this.page.waitForTimeout(500);
    
    const versionInput = this.page.locator('input[type="file"][name="new_version"]');
    await versionInput.setInputFiles(newVersionPath);
    
    await this.page.locator('button:has-text("Upload")').click();
    await this.page.waitForTimeout(3000);
  }

  async previewFile(fileName: string): Promise<void> {
    await this.page.locator(`.file-item:has-text("${fileName}")`).click();
    await this.previewModal.waitFor({ state: 'visible' });
  }

  async searchFiles(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(1000);
  }

  async filterByType(fileType: string): Promise<void> {
    await this.filterButton.click();
    await this.page.waitForTimeout(500);
    
    await this.page.locator(`mat-checkbox:has-text("${fileType}")`).click();
    
    await this.page.locator('button:has-text("Apply")').click();
    await this.page.waitForTimeout(1000);
  }

  async addTags(fileName: string, tags: string[]): Promise<void> {
    await this.selectFile(fileName);
    
    await this.page.locator('button:has-text("Edit tags")').click();
    await this.page.waitForTimeout(500);
    
    for (const tag of tags) {
      await this.tagInput.fill(tag);
      await this.page.keyboard.press('Enter');
    }
    
    await this.page.locator('button:has-text("Save")').click();
    await this.page.waitForTimeout(2000);
  }

  async projectFile(fileName: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.projectButton.click();
    await this.page.waitForTimeout(2000);
  }

  async downloadFiles(fileNames: string[]): Promise<void> {
    // Select files
    for (const fileName of fileNames) {
      await this.page.locator(`mat-checkbox:near(:text("${fileName}"))`).click();
    }
    
    await this.downloadButton.click();
    
    // Wait for download to start
    const downloadPromise = this.page.waitForEvent('download');
    const download = await downloadPromise;
    
    // Save the file
    const timestamp = Date.now();
    await download.saveAs(`./test-results/downloaded-files-${timestamp}.zip`);
  }

  async getFileCount(): Promise<number> {
    return await this.fileList.count();
  }

  async selectFile(fileName: string): Promise<void> {
    await this.page.locator(`.file-item:has-text("${fileName}")`).click();
    await this.page.waitForTimeout(500);
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.deleteButton.click();
    await this.page.locator('button:has-text("Confirm")').click();
    await this.page.waitForTimeout(2000);
  }

  async getStorageInfo(): Promise<{
    used: string;
    limit: string;
    percentage: number;
  }> {
    const storageText = await this.page.locator('.storage-info, [data-cy="storage-meter"]').textContent() || '';
    
    // Parse "2.5 GB / 10 GB (25%)" format
    const match = storageText.match(/([\d.]+\s*[KMGT]B)\s*\/\s*([\d.]+\s*[KMGT]B)\s*\((\d+)%\)/);
    
    if (match) {
      return {
        used: match[1],
        limit: match[2],
        percentage: parseInt(match[3])
      };
    }
    
    return { used: '0 GB', limit: '0 GB', percentage: 0 };
  }
}