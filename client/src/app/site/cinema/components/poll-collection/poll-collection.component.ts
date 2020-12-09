import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { OperatorService } from 'app/core/core-services/operator.service';
import { ViewAssignment } from 'app/site/assignments/models/view-assignment';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { PollClassType, ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { PollListObservableService } from 'app/site/polls/services/poll-list-observable.service';

@Component({
    selector: 'os-poll-collection',
    templateUrl: './poll-collection.component.html',
    styleUrls: ['./poll-collection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollCollectionComponent extends BaseViewComponentDirective implements OnInit {
    public polls: ViewBasePoll[];

    public lastPublishedPoll: ViewBasePoll;

    private _currentProjection: BaseViewModel<any>;

    public get currentProjection(): BaseViewModel<any> {
        return this._currentProjection;
    }

    /**
     * CLEANUP: This function belongs to "HasViewPolls"/ ViewModelWithPolls
     */
    public get hasProjectedModelOpenPolls(): boolean {
        if (this.currentProjection instanceof ViewMotion || this.currentProjection instanceof ViewAssignment) {
            const currPolls: ViewMotionPoll[] | ViewAssignmentPoll[] = this.currentProjection.polls;
            return currPolls.some((p: ViewMotionPoll | ViewAssignmentPoll) => p.isStarted);
        }
        return false;
    }

    @Input()
    public set currentProjection(viewModel: BaseViewModel<any>) {
        this._currentProjection = viewModel;
        this.updateLastPublished();
    }

    private get showExtendedTitle(): boolean {
        const areAllPollsSameModel = this.polls.every(
            poll => this.polls[0].getContentObject() === poll.getContentObject()
        );

        if (this.currentProjection && areAllPollsSameModel) {
            return this.polls[0]?.getContentObject() !== this.currentProjection;
        } else {
            return !areAllPollsSameModel;
        }
    }

    public constructor(
        title: Title,
        translate: TranslateService,
        snackBar: MatSnackBar,
        private operator: OperatorService,
        private pollService: PollListObservableService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, snackBar);
    }

    public ngOnInit(): void {
        this.subscriptions.push(
            this.pollService
                .getViewModelListObservable()
                .pipe(
                    map(polls => {
                        return polls.filter(poll => {
                            return poll.canBeVotedFor();
                        });
                    })
                )
                .subscribe(polls => {
                    this.polls = polls;
                    this.cd.markForCheck();
                    this.updateLastPublished();
                })
        );
    }

    public identifyPoll(index: number, poll: ViewBasePoll): number {
        return poll.id;
    }

    public getPollDetailLink(poll: ViewBasePoll): string {
        return poll.parentLink;
    }

    public getPollVoteTitle(poll: ViewBasePoll): string {
        const contentObject = poll.getContentObject();
        const listTitle = contentObject.getListTitle();
        const model = contentObject.getVerboseName();
        const pollTitle = poll.getTitle();

        if (this.showExtendedTitle) {
            return `(${model}) ${listTitle} - ${pollTitle}`;
        } else {
            return pollTitle;
        }
    }

    /**
     * Helper function to detect new latest published polls and set them.
     */
    private updateLastPublished(): void {
        const lastPublished = this.getLastfinshedPoll(this.currentProjection);
        if (lastPublished !== this.lastPublishedPoll) {
            this.lastPublishedPoll = lastPublished;
            this.cd.markForCheck();
        }
    }

    /**
     * CLEANUP: This function belongs to "HasViewPolls"/ ViewModelWithPolls
     * *class* (is an interface right now)
     *
     * @param viewModel
     */
    private getLastfinshedPoll(viewModel: BaseViewModel): ViewBasePoll {
        if (viewModel instanceof ViewMotion || viewModel instanceof ViewAssignment) {
            let currPolls: ViewMotionPoll[] | ViewAssignmentPoll[] = viewModel.polls;
            /**
             * Although it should, since the union type could use `.filter
             * without any problem, without an any cast it will not work
             */
            currPolls = (currPolls as any[])
                .filter((p: ViewMotionPoll | ViewAssignmentPoll) => p.stateHasVotes)
                .reverse();
            return currPolls[0];
        }
        return null;
    }

    public canManage(poll: ViewBasePoll): boolean {
        if (poll.pollClassType === PollClassType.Motion) {
            return this.operator.hasPerms(this.permission.motionsCanManagePolls);
        } else if (poll.pollClassType === PollClassType.Assignment) {
            return this.operator.hasPerms(this.permission.assignmentsCanManage);
        }
        return false;
    }
}
