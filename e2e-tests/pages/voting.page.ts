import { Page, Locator } from '@playwright/test';

export class VotingPage {
  readonly page: Page;
  readonly voteYesButton: Locator;
  readonly voteNoButton: Locator;
  readonly voteAbstainButton: Locator;
  readonly submitVoteButton: Locator;
  readonly votingInterface: Locator;
  readonly candidateList: Locator;
  readonly voteResults: Locator;
  readonly changeVoteButton: Locator;
  readonly delegationSelect: Locator;
  readonly votingTimer: Locator;
  readonly turnoutIndicator: Locator;
  readonly generateReportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.voteYesButton = page.locator('button:has-text("Yes"), [data-cy="vote-yes"]');
    this.voteNoButton = page.locator('button:has-text("No"), [data-cy="vote-no"]');
    this.voteAbstainButton = page.locator('button:has-text("Abstain"), [data-cy="vote-abstain"]');
    this.submitVoteButton = page.locator('button:has-text("Submit vote"), button:has-text("Cast vote")');
    this.votingInterface = page.locator('.voting-interface, [class*="voting-panel"]');
    this.candidateList = page.locator('.candidate-list, mat-selection-list');
    this.voteResults = page.locator('.vote-results, [class*="results-panel"]');
    this.changeVoteButton = page.locator('button:has-text("Change vote")');
    this.delegationSelect = page.locator('mat-select[formcontrolname="vote_for"], select[name="delegation"]');
    this.votingTimer = page.locator('.voting-timer, [class*="countdown"]');
    this.turnoutIndicator = page.locator('.turnout, [class*="participation"]');
    this.generateReportButton = page.locator('button:has-text("Generate report")');
  }

  async voteOnMotion(vote: 'yes' | 'no' | 'abstain'): Promise<void> {
    switch (vote) {
      case 'yes':
        await this.voteYesButton.click();
        break;
      case 'no':
        await this.voteNoButton.click();
        break;
      case 'abstain':
        await this.voteAbstainButton.click();
        break;
    }
    
    await this.submitVoteButton.click();
    await this.page.waitForTimeout(2000);
  }

  async voteOnElection(candidateNames: string[]): Promise<void> {
    for (const name of candidateNames) {
      await this.page.locator(`mat-list-option:has-text("${name}"), input[value="${name}"]`).click();
    }
    
    await this.submitVoteButton.click();
    await this.page.waitForTimeout(2000);
  }

  async changeVote(newVote: 'yes' | 'no' | 'abstain'): Promise<void> {
    await this.changeVoteButton.click();
    await this.page.waitForTimeout(500);
    
    await this.voteOnMotion(newVote);
  }

  async voteAsProxy(principalName: string, vote: 'yes' | 'no' | 'abstain'): Promise<void> {
    await this.delegationSelect.click();
    await this.page.locator(`mat-option:has-text("${principalName}")`).click();
    
    await this.voteOnMotion(vote);
  }

  async waitForVotingToOpen(): Promise<void> {
    await this.votingInterface.waitFor({ state: 'visible', timeout: 30000 });
  }

  async isVotingOpen(): Promise<boolean> {
    return await this.votingInterface.isVisible();
  }

  async hasAlreadyVoted(): Promise<boolean> {
    const confirmationMessage = await this.page.locator('text="You have already voted"').isVisible();
    const changeVoteVisible = await this.changeVoteButton.isVisible();
    
    return confirmationMessage || changeVoteVisible;
  }

  async getVoteResults(): Promise<{
    yes: number;
    no: number;
    abstain: number;
    total: number;
  }> {
    await this.voteResults.waitFor({ state: 'visible' });
    
    const yesText = await this.page.locator('.yes-votes, [data-cy="yes-count"]').textContent() || '0';
    const noText = await this.page.locator('.no-votes, [data-cy="no-count"]').textContent() || '0';
    const abstainText = await this.page.locator('.abstain-votes, [data-cy="abstain-count"]').textContent() || '0';
    
    const yes = parseInt(yesText.replace(/\D/g, ''));
    const no = parseInt(noText.replace(/\D/g, ''));
    const abstain = parseInt(abstainText.replace(/\D/g, ''));
    
    return {
      yes,
      no,
      abstain,
      total: yes + no + abstain
    };
  }

  async getTurnout(): Promise<{
    voted: number;
    eligible: number;
    percentage: number;
  }> {
    const turnoutText = await this.turnoutIndicator.textContent() || '';
    
    // Parse "45/100 (45%)" format
    const match = turnoutText.match(/(\d+)\/(\d+)\s*\((\d+)%\)/);
    
    if (match) {
      return {
        voted: parseInt(match[1]),
        eligible: parseInt(match[2]),
        percentage: parseInt(match[3])
      };
    }
    
    return { voted: 0, eligible: 0, percentage: 0 };
  }

  async getRemainingTime(): Promise<string> {
    return await this.votingTimer.textContent() || '00:00';
  }

  async isVotingClosed(): Promise<boolean> {
    const closedMessage = await this.page.locator('text="Voting has closed"').isVisible();
    const expiredTimer = await this.page.locator('.timer-expired').isVisible();
    
    return closedMessage || expiredTimer;
  }

  async generateVotingReport(): Promise<void> {
    await this.generateReportButton.click();
    await this.page.waitForTimeout(1000);
    
    // Wait for download to start
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator('button:has-text("Download")').click();
    const download = await downloadPromise;
    
    // Save the file
    await download.saveAs(`./test-results/voting-report-${Date.now()}.pdf`);
  }

  async canSeeVoterNames(): Promise<boolean> {
    return await this.page.locator('.voter-list, [class*="voter-names"]').isVisible();
  }

  async getWeightedVoteDisplay(): Promise<string> {
    const weightElement = await this.page.locator('.vote-weight, [data-cy="vote-weight"]');
    return await weightElement.textContent() || '1';
  }
}