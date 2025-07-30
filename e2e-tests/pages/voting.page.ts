import { Page } from '@playwright/test';
import { EnhancedBasePage } from './EnhancedBasePage';

export class VotingPage extends EnhancedBasePage {
  readonly voteYesButton: string;
  readonly voteNoButton: string;
  readonly voteAbstainButton: string;
  readonly submitVoteButton: string;
  readonly votingInterface: string;
  readonly candidateList: string;
  readonly voteResults: string;
  readonly changeVoteButton: string;
  readonly delegationSelect: string;
  readonly votingTimer: string;
  readonly turnoutIndicator: string;
  readonly generateReportButton: string;

  constructor(page: Page) {
    super(page);
    this.voteYesButton = 'button:has-text("Yes"), [data-cy="vote-yes"]';
    this.voteNoButton = 'button:has-text("No"), [data-cy="vote-no"]';
    this.voteAbstainButton = 'button:has-text("Abstain"), [data-cy="vote-abstain"]';
    this.submitVoteButton = 'button:has-text("Submit vote"), button:has-text("Cast vote")';
    this.votingInterface = '.voting-interface, [class*="voting-panel"]';
    this.candidateList = '.candidate-list, mat-selection-list';
    this.voteResults = '.vote-results, [class*="results-panel"]';
    this.changeVoteButton = 'button:has-text("Change vote")';
    this.delegationSelect = 'mat-select[formcontrolname="vote_for"], select[name="delegation"]';
    this.votingTimer = '.voting-timer, [class*="countdown"]';
    this.turnoutIndicator = '.turnout, [class*="participation"]';
    this.generateReportButton = 'button:has-text("Generate report")';
  }

  async voteOnMotion(vote: 'yes' | 'no' | 'abstain'): Promise<void> {
    switch (vote) {
      case 'yes':
        await this.click(this.voteYesButton);
        break;
      case 'no':
        await this.click(this.voteNoButton);
        break;
      case 'abstain':
        await this.click(this.voteAbstainButton);
        break;
    }
    
    await this.click(this.submitVoteButton, {
      waitForNetworkIdle: true,
      waitForResponse: (response) => response.url().includes('/api/') && response.status() === 200
    });
  }

  async voteOnElection(candidateNames: string[]): Promise<void> {
    for (const name of candidateNames) {
      await this.click(`mat-list-option:has-text("${name}"), input[value="${name}"]`);
    }
    
    await this.click(this.submitVoteButton, {
      waitForNetworkIdle: true
    });
  }

  async changeVote(newVote: 'yes' | 'no' | 'abstain'): Promise<void> {
    await this.click(this.changeVoteButton, {
      waitForLoadState: true
    });
    
    await this.voteOnMotion(newVote);
  }

  async voteAsProxy(principalName: string, vote: 'yes' | 'no' | 'abstain'): Promise<void> {
    await this.click(this.delegationSelect);
    await this.click(`mat-option:has-text("${principalName}")`);
    
    await this.voteOnMotion(vote);
  }

  async waitForVotingToOpen(): Promise<void> {
    await this.waitForElementStable(this.votingInterface, 30000);
  }

  async isVotingOpen(): Promise<boolean> {
    return await this.isVisible(this.votingInterface, { timeout: 5000 });
  }

  async hasAlreadyVoted(): Promise<boolean> {
    const confirmationMessage = await this.isVisible('text="You have already voted"', { timeout: 2000 });
    const changeVoteVisible = await this.isVisible(this.changeVoteButton, { timeout: 2000 });
    
    return confirmationMessage || changeVoteVisible;
  }

  async getVoteResults(): Promise<{
    yes: number;
    no: number;
    abstain: number;
    total: number;
  }> {
    await this.waitForElementStable(this.voteResults);
    
    const yesText = await this.getText('.yes-votes, [data-cy="yes-count"]');
    const noText = await this.getText('.no-votes, [data-cy="no-count"]');
    const abstainText = await this.getText('.abstain-votes, [data-cy="abstain-count"]');
    
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
    const turnoutText = await this.getText(this.turnoutIndicator);
    
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
    const time = await this.getText(this.votingTimer);
    return time || '00:00';
  }

  async isVotingClosed(): Promise<boolean> {
    const closedMessage = await this.isVisible('text="Voting has closed"', { timeout: 2000 });
    const expiredTimer = await this.isVisible('.timer-expired', { timeout: 2000 });
    
    return closedMessage || expiredTimer;
  }

  async generateVotingReport(): Promise<void> {
    await this.click(this.generateReportButton, {
      waitForLoadState: true
    });
    
    // Wait for download to start
    const downloadPromise = this.page.waitForEvent('download');
    await this.click('button:has-text("Download")', {
      waitForNetworkIdle: true
    });
    const download = await downloadPromise;
    
    // Save the file
    await download.saveAs(`./test-results/voting-report-${Date.now()}.pdf`);
  }

  async canSeeVoterNames(): Promise<boolean> {
    return await this.isVisible('.voter-list, [class*="voter-names"]', { timeout: 5000 });
  }

  async getWeightedVoteDisplay(): Promise<string> {
    const weight = await this.getText('.vote-weight, [data-cy="vote-weight"]');
    return weight || '1';
  }
}