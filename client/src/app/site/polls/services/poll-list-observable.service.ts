import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { HasViewModelListObservable } from 'app/core/definitions/has-view-model-list-observable';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { PollClassType, ViewBasePoll } from '../models/view-base-poll';

@Injectable({
    providedIn: 'root'
})
export class PollListObservableService implements HasViewModelListObservable<ViewBasePoll> {
    // protected so tslint doesn't complain
    protected motionPolls: ViewMotionPoll[] = [];
    protected assignmentPolls: ViewAssignmentPoll[] = [];

    private readonly viewPollListSubject: BehaviorSubject<ViewBasePoll[]> = new BehaviorSubject<ViewBasePoll[]>([]);

    public constructor(
        motionPollRepo: MotionPollRepositoryService,
        assignmentPollRepo: AssignmentPollRepositoryService,
        private mapper: CollectionStringMapperService
    ) {
        motionPollRepo
            .getViewModelListObservable()
            .subscribe(polls => this.adjustViewModelListObservable(polls, PollClassType.Motion));
        assignmentPollRepo
            .getViewModelListObservable()
            .subscribe(polls => this.adjustViewModelListObservable(polls, PollClassType.Assignment));
    }

    private adjustViewModelListObservable(polls: ViewBasePoll[], mode: PollClassType): void {
        this[mode + 'Polls'] = polls;

        const allPolls = (this.motionPolls as ViewBasePoll[]).concat(this.assignmentPolls);
        this.viewPollListSubject.next(allPolls);
    }

    public getViewModelListObservable(): Observable<ViewBasePoll[]> {
        return this.viewPollListSubject.asObservable();
    }

    public getObservableFromViewModel(poll: ViewBasePoll): Observable<BaseViewModel> {
        return this.mapper.getRepository(poll.collectionString).getViewModelObservable(poll.id);
    }
}
