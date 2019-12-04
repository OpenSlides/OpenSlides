import { Component, OnInit } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { Label } from 'ng2-charts';
import { BehaviorSubject, Observable } from 'rxjs';

import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Breadcrumb } from 'app/shared/components/breadcrumb/breadcrumb.component';
import { ChartData } from 'app/shared/components/charts/charts.component';
import { PollState } from 'app/shared/models/poll/base-poll';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { ViewGroup } from 'app/site/users/models/view-group';
import { MotionPollDialogComponent } from '../motion-poll-dialog/motion-poll-dialog.component';

@Component({
    selector: 'os-motion-poll-detail',
    templateUrl: './motion-poll-detail.component.html',
    styleUrls: ['./motion-poll-detail.component.scss']
})
export class MotionPollDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * Id of the poll.
     */
    private pollId: number;

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
    public poll: ViewMotionPoll = null;

    /**
     * Id of the parent motion of this poll.
     */
    public motionId: number;

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
        private repo: MotionPollRepositoryService,
        private route: ActivatedRoute,
        private groupRepo: GroupRepositoryService,
        private promptDialog: PromptService,
        private dialog: MatDialog
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

    /**
     * Opens the dialog, so the user can enter votes.
     */
    public async enterVote(): Promise<void> {
        const dialogRef = this.dialog.open(MotionPollDialogComponent, {
            data: this.poll,
            ...mediumDialogSettings
        });
        dialogRef.afterClosed().subscribe(async result => {
            if (!result) {
                return;
            }
            if (result.data) {
                this.repo.enterAnalogVote(this.poll, result.data);
            }
        });
    }

    /**
     * Deletes this poll.
     */
    public async deletePoll(): Promise<void> {
        const title = 'Delete poll';
        const text = 'Do you really want to delete the selected poll?';

        if (await this.promptDialog.open(title, text)) {
            await this.repo.delete(this.poll);
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
            this.chartDataSubject.next(this.poll.generateChartData());
        }
    }

    /**
     * Helper-function to search for this poll and display data or create a new one.
     */
    private findComponentById(): void {
        const params = this.route.snapshot.params;
        if (params && params.id) {
            this.pollId = +params.id;
            this.subscriptions.push(
                this.repo.getViewModelObservable(this.pollId).subscribe(poll => {
                    if (poll) {
                        this.poll = poll;
                        this.updateBreadcrumbs();
                        this.checkData();
                        this.labels = this.createChartLabels();
                    }
                })
            );
        }
    }

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
     * Function to create the labels for the chart.
     *
     * @returns An array of `Label`.
     */
    private createChartLabels(): Label[] {
        return ['Number of votes'];
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
