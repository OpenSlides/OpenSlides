import { OnInit } from '@angular/core';
import { MatSnackBar, MatTableDataSource } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { Label } from 'ng2-charts';
import { BehaviorSubject, Observable } from 'rxjs';

import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { BasePollDialogService } from 'app/core/ui-services/base-poll-dialog.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Breadcrumb } from 'app/shared/components/breadcrumb/breadcrumb.component';
import { ChartData, ChartType } from 'app/shared/components/charts/charts.component';
import { PollState, PollType } from 'app/shared/models/poll/base-poll';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';
import { BasePollRepositoryService } from '../services/base-poll-repository.service';
import { ViewBasePoll } from '../models/view-base-poll';

export interface BaseVoteData {
    user?: ViewUser;
}

export abstract class BasePollDetailComponent<V extends ViewBasePoll> extends BaseViewComponent implements OnInit {
    /**
     * All the groups of users.
     */
    public userGroups: ViewGroup[] = [];

    /**
     * Holding all groups.
     */
    public groupObservable: Observable<ViewGroup[]> = null;

    /**
     * The reference to the poll.
     */
    public poll: V = null;

    /**
     * The breadcrumbs for the poll-states.
     */
    public breadcrumbs: Breadcrumb[] = [];

    /**
     * Sets the type of the shown chart, if votes are entered.
     */
    public abstract get chartType(): ChartType;

    /**
     * The different labels for the votes (used for chart).
     */
    public labels: Label[] = [];

    /**
     * Subject, that holds the data for the chart.
     */
    public chartDataSubject: BehaviorSubject<ChartData> = new BehaviorSubject(null);

    // The datasource for the votes-per-user table
    public votesDataSource: MatTableDataSource<BaseVoteData> = new MatTableDataSource();

    /**
     * Constructor
     *
     * @param title
     * @param translate
     * @param matSnackbar
     * @param repo
     * @param route
     * @param router
     * @param fb
     * @param groupRepo
     * @param location
     * @param promptService
     * @param dialog
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        protected repo: BasePollRepositoryService,
        protected route: ActivatedRoute,
        protected groupRepo: GroupRepositoryService,
        protected promptService: PromptService,
        protected pollDialog: BasePollDialogService<V>
    ) {
        super(title, translate, matSnackbar);
        this.votesDataSource.filterPredicate = this.dataSourceFilterPredicate;
    }

    /**
     * OnInit-method.
     */
    public ngOnInit(): void {
        this.findComponentById();

        this.groupObservable = this.groupRepo.getViewModelListObservable();
        this.subscriptions.push(
            this.groupRepo.getViewModelListObservable().subscribe(groups => (this.userGroups = groups))
        );
    }

    public async deletePoll(): Promise<void> {
        const title = 'Delete poll';
        const text = 'Do you really want to delete the selected poll?';

        if (await this.promptService.open(title, text)) {
            this.repo.delete(this.poll).then(() => this.onDeleted(), this.raiseError);
        }
    }

    public async pseudoanonymizePoll(): Promise<void> {
        const title = 'Anonymize single votes';
        const text = 'Do you really want to anonymize all votes? This cannot be undone.';

        if (await this.promptService.open(title, text)) {
            this.repo.pseudoanonymize(this.poll).then(() => this.onPollLoaded(), this.raiseError); // votes have changed, but not the poll, so the components have to be informed about the update
        }
    }

    /**
     * Opens dialog for editing the poll
     */
    public openDialog(): void {
        this.pollDialog.openDialog(this.poll);
    }

    protected onDeleted(): void {}

    /**
     * Called after the poll has been loaded. Meant to be overwritten by subclasses who need initial access to the poll
     */
    protected onPollLoaded(): void {}

    protected onPollWithOptionsLoaded(): void {}

    protected onStateChanged(): void {}

    protected abstract hasPerms(): boolean;

    // custom filter for the data source: only search in usernames
    protected dataSourceFilterPredicate(data: BaseVoteData, filter: string): boolean {
        return (
            data.user &&
            data.user
                .getFullName()
                .trim()
                .toLowerCase()
                .indexOf(filter.trim().toLowerCase()) !== -1
        );
    }

    /**
     * sets the votes data only if the poll wasn't pseudoanonymized
     */
    protected setVotesData(data: BaseVoteData[]): void {
        if (data.every(voteDate => !voteDate.user)) {
            this.votesDataSource.data = null;
        } else {
            this.votesDataSource.data = data;
        }
    }

    /**
     * Initializes data for the shown chart.
     * Could be overwritten to implement custom chart data.
     */
    protected initChartData(): void {
        this.chartDataSubject.next(this.poll.generateChartData());
    }

    /**
     * This checks, if the poll has votes.
     */
    private checkData(): void {
        if (this.poll.state === 3 || this.poll.state === 4) {
            setTimeout(() => this.initChartData());
        }
    }

    /**
     * Helper-function to search for this poll and display data or create a new one.
     */
    private findComponentById(): void {
        const params = this.route.snapshot.params;
        if (params && params.id) {
            this.subscriptions.push(
                this.repo.getViewModelObservable(params.id).subscribe(poll => {
                    if (poll) {
                        this.poll = poll;
                        this.updateBreadcrumbs();
                        this.onPollLoaded();
                        this.waitForOptions();
                        this.checkData();
                    }
                })
            );
        }
    }

    /**
     * Waits until poll's options are loaded.
     */
    private waitForOptions(): void {
        if (!this.poll.options || !this.poll.options.length) {
            setTimeout(() => this.waitForOptions(), 1);
        } else {
            this.onPollWithOptionsLoaded();
        }
    }

    /**
     * Action for the different breadcrumbs.
     */
    private async changeState(): Promise<void> {
        this.actionWrapper(this.repo.changePollState(this.poll), this.onStateChanged);
    }

    /**
     * Resets the state of a motion-poll.
     */
    private async resetState(): Promise<void> {
        this.actionWrapper(this.repo.resetPoll(this.poll), this.onStateChanged);
    }

    /**
     * Used to execute same logic after fullfilling a promise.
     *
     * @param action Any promise to execute.
     *
     * @returns Any promise-like.
     */
    private actionWrapper(action: Promise<any>, callback?: () => any): any {
        action
            .then(() => {
                this.checkData();
                if (callback) {
                    callback();
                }
            })
            .catch(this.raiseError);
    }

    /**
     * Used to change the breadcrumbs depending on the state of the given motion-poll.
     */
    private updateBreadcrumbs(): void {
        this.breadcrumbs = Object.values(PollState)
            .filter(state => typeof state === 'string')
            .map((state: string) => ({
                label: state,
                action: this.getBreadcrumbAction(PollState[state]),
                active: this.poll ? this.poll.state === PollState[state] : false
            }));
    }

    /**
     * Depending on the state of the motion-poll, the breadcrumb has another action and state.
     *
     * @param state The state of the motion-poll as number.
     *
     * @returns An action, that is executed, if the breadcrumb is clicked, or null.
     */
    private getBreadcrumbAction(state: number): () => any | null {
        if (!this.poll) {
            return null;
        }
        if (!this.hasPerms()) {
            return null;
        }
        switch (this.poll.state) {
            case PollState.Created:
                return state === 2 ? () => this.changeState() : null;
            case PollState.Started:
                return this.poll.type !== PollType.Analog && state === 3 ? () => this.changeState() : null;
            case PollState.Finished:
                if (state === 1) {
                    return () => this.resetState();
                } else if (state === 4) {
                    return () => this.changeState();
                } else {
                    return null;
                }
            case PollState.Published:
                return state === 1 ? () => this.resetState() : null;
        }
    }
}
