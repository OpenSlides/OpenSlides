import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { BasePollDialogService } from 'app/core/ui-services/base-poll-dialog.service';
import { ChoiceService } from 'app/core/ui-services/choice.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartData } from 'app/shared/components/charts/charts.component';
import { PollState, PollType } from 'app/shared/models/poll/base-poll';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { BasePollRepositoryService } from '../services/base-poll-repository.service';
import { PollService } from '../services/poll.service';
import { PollStateChangeActionVerbose, ViewBasePoll } from '../models/view-base-poll';

export abstract class BasePollComponent<
    V extends ViewBasePoll,
    S extends PollService
> extends BaseViewComponentDirective {
    private stateChangePendingSubject = new Subject<boolean>();
    public readonly stateChangePendingObservable = this.stateChangePendingSubject.asObservable();

    public chartDataSubject: BehaviorSubject<ChartData> = new BehaviorSubject([]);

    protected _poll: V;

    public pollStateActions = {
        [PollState.Created]: {
            icon: 'play_arrow',
            css: 'start-poll-button'
        },
        [PollState.Started]: {
            icon: 'stop',
            css: 'stop-poll-button'
        },
        [PollState.Finished]: {
            icon: 'public',
            css: 'publish-poll-button'
        }
    };

    public get hideChangeState(): boolean {
        return this._poll.isPublished || (this._poll.isCreated && this._poll.type === PollType.Analog);
    }

    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        protected translate: TranslateService,
        protected dialog: MatDialog,
        protected promptService: PromptService,
        protected choiceService: ChoiceService,
        protected repo: BasePollRepositoryService,
        protected pollDialog: BasePollDialogService<V, S>
    ) {
        super(titleService, translate, matSnackBar);
    }

    public async nextPollState(): Promise<void> {
        const currentState: PollState = this._poll.state;
        if (currentState === PollState.Created || currentState === PollState.Finished) {
            await this.changeState(this._poll.nextState);
        } else if (currentState === PollState.Started) {
            const title = this.translate.instant('Are you sure you want to stop this voting?');
            const actions = [this.translate.instant('Stop'), this.translate.instant('Stop & publish')];
            const choice = await this.choiceService.open(title, null, false, actions);
            if (choice?.action === actions[0]) {
                await this.changeState(PollState.Finished);
            } else if (choice?.action === actions[1]) {
                await this.changeState(PollState.Published);
            }
        }
    }

    private async changeState(targetState: PollState): Promise<void> {
        this.stateChangePendingSubject.next(true);
        this.repo
            .changePollState(this._poll, targetState)
            .catch(this.raiseError)
            .finally(() => {
                this.stateChangePendingSubject.next(false);
            });
    }

    public async resetState(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to reset this vote?');
        const content = this.translate.instant('All votes will be lost.');
        if (await this.promptService.open(title, content)) {
            this.changeState(PollState.Created);
        }
    }

    /**
     * Handler for the 'delete poll' button
     */
    public async onDeletePoll(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this vote?');
        if (await this.promptService.open(title)) {
            await this.repo.delete(this._poll).catch(this.raiseError);
        }
    }

    /**
     * Edits the poll
     */
    public openDialog(): void {
        this.pollDialog.openDialog(this._poll);
    }

    /**
     * Forces to initialize the poll.
     */
    protected initPoll(model: V): void {
        this._poll = model;
    }

    public refreshPoll(): void {
        this.repo.refresh(this._poll);
    }
}
