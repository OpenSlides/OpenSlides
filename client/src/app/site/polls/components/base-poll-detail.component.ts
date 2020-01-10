import { OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { Label } from 'ng2-charts';
import { BehaviorSubject, Observable } from 'rxjs';

import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Breadcrumb } from 'app/shared/components/breadcrumb/breadcrumb.component';
import { ChartData } from 'app/shared/components/charts/charts.component';
import { PollState } from 'app/shared/models/poll/base-poll';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewGroup } from 'app/site/users/models/view-group';
import { BasePollRepositoryService } from '../services/base-poll-repository.service';
import { ViewBasePoll } from '../models/view-base-poll';

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
    public chartType = 'horizontalBar';

    /**
     * The different labels for the votes (used for chart).
     */
    public labels: Label[] = [];

    /**
     * Subject, that holds the data for the chart.
     */
    public chartDataSubject: BehaviorSubject<ChartData> = new BehaviorSubject(null);

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
     * @param promptDialog
     * @param dialog
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        protected repo: BasePollRepositoryService,
        protected route: ActivatedRoute,
        protected groupRepo: GroupRepositoryService,
        protected promptDialog: PromptService
    ) {
        super(title, translate, matSnackbar);
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

        if (await this.promptDialog.open(title, text)) {
            await this.repo.delete(this.poll);
        }
    }

    public async pseudoanonymizePoll(): Promise<void> {
        const title = 'Pseudoanonymize poll';
        const text = 'Do you really want to pseudoanonymize the selected poll?';

        if (await this.promptDialog.open(title, text)) {
            await this.repo.pseudoanonymize(this.poll);
        }
    }

    /**
     * This changes the data for the chart depending on the switch in the detail-view.
     *
     * @param isChecked boolean, if the chart should show the amount of entered votes.
     */
    public changeChart(): void {
        this.chartDataSubject.next(this.poll.generateChartData());
    }

    /**
     * This checks, if the poll has votes.
     */
    private checkData(): void {
        if (this.poll.state === 3 || this.poll.state === 4) {
            setTimeout(() => this.chartDataSubject.next(this.poll.generateChartData()));
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
                        this.checkData();
                        this.onPollLoaded();
                    }
                })
            );
        }
    }

    /**
     * Called after the poll has been loaded. Meant to be overwritten by subclasses who need initial access to the poll
     */
    public onPollLoaded(): void {}

    /**
     * Action for the different breadcrumbs.
     */
    private async changeState(): Promise<void> {
        this.actionWrapper(this.repo.changePollState(this.poll));
    }

    /**
     * Resets the state of a motion-poll.
     */
    private async resetState(): Promise<void> {
        this.actionWrapper(this.repo.resetPoll(this.poll));
    }

    /**
     * Used to execute same logic after fullfilling a promise.
     *
     * @param action Any promise to execute.
     *
     * @returns Any promise-like.
     */
    private actionWrapper(action: Promise<any>): any {
        action.then(() => this.checkData()).catch(this.raiseError);
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
        switch (this.poll.state) {
            case PollState.Created:
                return state === 2 ? () => this.changeState() : null;
            case PollState.Started:
                return null;
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
