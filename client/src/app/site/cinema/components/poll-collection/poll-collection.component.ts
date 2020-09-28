import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { PollListObservableService } from 'app/site/polls/services/poll-list-observable.service';

@Component({
    selector: 'os-poll-collection',
    templateUrl: './poll-collection.component.html',
    styleUrls: ['./poll-collection.component.scss']
})
export class PollCollectionComponent extends BaseViewComponentDirective implements OnInit {
    public polls: ViewBasePoll[];

    @Input()
    private currentProjection: BaseViewModel<any>;

    private get showExtendedTitle(): boolean {
        const areAllPollsSameModel = this.polls.every(
            poll => this.polls[0].getContentObject() === poll.getContentObject()
        );

        if (this.currentProjection && areAllPollsSameModel) {
            return this.polls[0].getContentObject() !== this.currentProjection;
        } else {
            return !areAllPollsSameModel;
        }
    }

    public constructor(
        title: Title,
        translate: TranslateService,
        snackBar: MatSnackBar,
        private pollService: PollListObservableService
    ) {
        super(title, translate, snackBar);
    }

    public ngOnInit(): void {
        this.subscriptions.push(
            this.pollService
                .getViewModelListObservable()
                .pipe(map(polls => polls.filter(poll => poll.canBeVotedFor())))
                .subscribe(polls => {
                    this.polls = polls;
                })
        );
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

    public getPollDetailLink(poll: ViewBasePoll): string {
        return poll.parentLink;
    }
}
