import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { PollListObservableService } from 'app/site/polls/services/poll-list-observable.service';
import { BannerDefinition, BannerService } from './banner.service';
import { OpenSlidesStatusService } from '../core-services/openslides-status.service';
import { VotingService } from './voting.service';

@Injectable({
    providedIn: 'root'
})
export class VotingBannerService {
    private currentBanner: BannerDefinition;

    public constructor(
        pollListObservableService: PollListObservableService,
        private banner: BannerService,
        private translate: TranslateService,
        private OSStatus: OpenSlidesStatusService,
        private votingService: VotingService
    ) {
        pollListObservableService.getViewModelListObservable().subscribe(polls => this.checkForVotablePolls(polls));
    }

    /**
     * checks all polls for votable ones and displays a banner for them
     * @param polls the updated poll list
     */
    private checkForVotablePolls(polls: ViewBasePoll[]): void {
        // display no banner if in history mode
        if (this.OSStatus.isInHistoryMode && this.currentBanner) {
            this.banner.removeBanner(this.currentBanner);
            this.currentBanner = null;
            return;
        }

        const pollsToVote = polls.filter(poll => this.votingService.canVote(poll) && !poll.user_has_voted);
        if (pollsToVote.length === 1) {
            const poll = pollsToVote[0];
            const banner = {
                text: this.translate.instant('Click here to vote on the poll') + ` "${poll.title}"!`,
                link: poll.parentLink,
                bgColor: 'green'
            };
            this.banner.replaceBanner(this.currentBanner, banner);
            this.currentBanner = banner;
        } else if (pollsToVote.length > 1) {
            const banner = {
                text:
                    this.translate.instant('You have') +
                    ` ${pollsToVote.length} ` +
                    this.translate.instant('polls to vote on!'),
                link: '/polls/',
                bgColor: 'green'
            };
            this.banner.replaceBanner(this.currentBanner, banner);
            this.currentBanner = banner;
        } else {
            this.banner.removeBanner(this.currentBanner);
            this.currentBanner = null;
        }
    }
}
