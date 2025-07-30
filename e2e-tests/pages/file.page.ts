import { Page } from '@playwright/test';
import * as path from 'path';
import { EnhancedBasePage } from './EnhancedBasePage';

export class FilePage extends EnhancedBasePage {
  readonly uploadButton: string;
  readonly fileList: string;
  readonly fileInput: string;
  readonly descriptionInput: string;
  readonly createFolderButton: string;
  readonly searchInput: string;
  readonly filterButton: string;
  readonly downloadButton: string;
  readonly deleteButton: string;
  readonly moveButton: string;
  readonly tagInput: string;
  readonly projectButton: string;
  readonly previewModal: string;
  readonly versionHistoryButton: string;

  constructor(page: Page) {
    super(page);
    this.uploadButton = 'button:has-text("Upload"), [data-cy="upload-file"]';
    this.fileList = '.file-list, [class*="file-item"], mat-card';
    this.fileInput = 'input[type="file"]';
    this.descriptionInput = 'textarea[formcontrolname="description"], input[placeholder*="description"]';
    this.createFolderButton = 'button:has-text("New folder"), button:has-text("Create folder")';
    this.searchInput = 'input[type="search"], input[placeholder*="Search files"]';
    this.filterButton = 'button:has-text("Filter"), [data-cy="filter-files"]';
    this.downloadButton = 'button:has-text("Download")';
    this.deleteButton = 'button:has-text("Delete")';
    this.moveButton = 'button:has-text("Move")';
    this.tagInput = 'input[formcontrolname="tags"], mat-chip-input';
    this.projectButton = 'button:has-text("Project")';
    this.previewModal = '.file-preview, mat-dialog-container';
    this.versionHistoryButton = 'button:has-text("Version history")';
  }

  async navigate(): Promise<void> {
    await this.goto('/files', {
      waitForNetworkIdle: true
    });
  }

  async uploadFile(filePath: string, description?: string): Promise<void> {
    await this.click(this.uploadButton, {
      waitForLoadState: true
    });
    
    await this.page.locator(this.fileInput).setInputFiles(filePath);
    
    if (description) {
      await this.fill(this.descriptionInput, description);
    }
    
    await this.click('button:has-text("Upload")', {
      waitForNetworkIdle: true
    });
    
    // Wait for upload to complete
    await this.page.waitForSelector('.upload-progress', { state: 'hidden', timeout: 30000 });
  }

  async uploadMultipleFiles(filePaths: string[]): Promise<void> {
    await this.click(this.uploadButton, {
      waitForLoadState: true
    });
    
    await this.page.locator(this.fileInput).setInputFiles(filePaths);
    
    await this.click('button:has-text("Upload all")', {
      waitForNetworkIdle: true
    });
    
    // Wait for all uploads to complete
    await this.page.waitForSelector('.upload-progress', { state: 'hidden', timeout: 60000 });
  }

  async createFolder(folderName: string): Promise<void> {
    await this.click(this.createFolderButton, {
      waitForLoadState: true
    });
    
    const folderNameInput = 'input[formcontrolname="folder_name"], input[placeholder*="Folder name"]';
    await this.fill(folderNameInput, folderName);
    
    await this.click('button:has-text("Create")', {
      waitForNetworkIdle: true
    });
  }

  async moveFilesToFolder(fileNames: string[], folderName: string): Promise<void> {
    // Select files
    for (const fileName of fileNames) {
      await this.click(`mat-checkbox:near(:text("${fileName}")), input[type="checkbox"]:near(:text("${fileName}"))`);
    }
    
    await this.click(this.moveButton, {
      waitForLoadState: true
    });
    
    // Select target folder
    await this.click(`mat-tree-node:has-text("${folderName}"), .folder-item:has-text("${folderName}")`);
    
    await this.click('button:has-text("Move here")', {
      waitForNetworkIdle: true
    });
  }

  async setFileVisibility(fileName: string, visibility: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.click('button:has-text("Properties"), button:has-text("Edit")', {
      waitForLoadState: true
    });
    
    await this.click('mat-select[formcontrolname="visibility"]');
    await this.click(`mat-option:has-text("${visibility}")`);
    
    await this.click('button:has-text("Save")', {
      waitForNetworkIdle: true
    });
  }

  async linkFileToAgendaItem(fileName: string, agendaItemTitle: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.click('button:has-text("Link to agenda")', {
      waitForLoadState: true
    });
    
    await this.click(`mat-option:has-text("${agendaItemTitle}")`);
    
    await this.click('button:has-text("Link")', {
      waitForNetworkIdle: true
    });
  }

  async uploadNewVersion(fileName: string, newVersionPath: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.click('button:has-text("Upload new version")', {
      waitForLoadState: true
    });
    
    const versionInput = this.page.locator('input[type="file"][name="new_version"]');
    await versionInput.setInputFiles(newVersionPath);
    
    await this.click('button:has-text("Upload")', {
      waitForNetworkIdle: true,
      timeout: 30000
    });
  }

  async previewFile(fileName: string): Promise<void> {
    await this.click(`.file-item:has-text("${fileName}")`, {
      waitForLoadState: true
    });
    await this.waitForElementStable(this.previewModal);
  }

  async searchFiles(searchTerm: string): Promise<void> {
    await this.fill(this.searchInput, searchTerm, {
      waitForNetworkIdle: true
    });
  }

  async filterByType(fileType: string): Promise<void> {
    await this.click(this.filterButton, {
      waitForLoadState: true
    });
    
    await this.click(`mat-checkbox:has-text("${fileType}")`);
    
    await this.click('button:has-text("Apply")', {
      waitForNetworkIdle: true
    });
  }

  async addTags(fileName: string, tags: string[]): Promise<void> {
    await this.selectFile(fileName);
    
    await this.click('button:has-text("Edit tags")', {
      waitForLoadState: true
    });
    
    for (const tag of tags) {
      await this.fill(this.tagInput, tag);
      await this.page.keyboard.press('Enter');
    }
    
    await this.click('button:has-text("Save")', {
      waitForNetworkIdle: true
    });
  }

  async projectFile(fileName: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.click(this.projectButton, {
      waitForNetworkIdle: true
    });
  }

  async downloadFiles(fileNames: string[]): Promise<void> {
    // Select files
    for (const fileName of fileNames) {
      await this.click(`mat-checkbox:near(:text("${fileName}"))`);
    }
    
    const downloadPromise = this.page.waitForEvent('download');
    await this.click(this.downloadButton);
    const download = await downloadPromise;
    
    // Save the file
    const timestamp = Date.now();
    await download.saveAs(`./test-results/downloaded-files-${timestamp}.zip`);
  }

  async getFileCount(): Promise<number> {
    await this.waitForElementStable(this.fileList);
    return await this.page.locator(this.fileList).count();
  }

  async selectFile(fileName: string): Promise<void> {
    await this.click(`.file-item:has-text("${fileName}")`, {
      waitForLoadState: true
    });
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.selectFile(fileName);
    
    await this.click(this.deleteButton, {
      waitForLoadState: true
    });
    await this.click('button:has-text("Confirm")', {
      waitForNetworkIdle: true
    });
  }

  async getStorageInfo(): Promise<{
    used: string;
    limit: string;
    percentage: number;
  }> {
    const storageText = await this.getText('.storage-info, [data-cy="storage-meter"]');
    
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