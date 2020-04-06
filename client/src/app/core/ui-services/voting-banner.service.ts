import { Injectable } from '@angular/core';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';

import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
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

    private subText = _('Click here to vote!');

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
        // display no banner if in history mode or there are no polls to vote
        const pollsToVote = polls.filter(poll => this.votingService.canVote(poll) && !poll.user_has_voted);
        if ((this.OSStatus.isInHistoryMode && this.currentBanner) || !pollsToVote.length) {
            this.sliceBanner();
            return;
        }

        const banner =
            pollsToVote.length === 1
                ? this.createBanner(this.getTextForPoll(pollsToVote[0]), pollsToVote[0].parentLink)
                : this.createBanner(`${pollsToVote.length} ${this.translate.instant('open votes')}`, '/polls/');
        this.sliceBanner(banner);
    }

    /**
     * Creates a new `BannerDefinition` and returns it.
     *
     * @param text The text for the banner.
     * @param link The link for the banner.
     *
     * @returns The created banner.
     */
    private createBanner(text: string, link: string): BannerDefinition {
        return {
            text: text,
            subText: this.subText,
            link: link,
            icon: 'how_to_vote',
            largerOnMobileView: true
        };
    }

    /**
     * Returns for a given poll a title for the banner.
     *
     * @param poll The given poll.
     *
     * @returns The title.
     */
    private getTextForPoll(poll: ViewBasePoll): string {
        if (poll instanceof ViewMotionPoll) {
            return `${this.translate.instant('Motion')} ${poll.motion.getIdentifierOrTitle()}: ${this.translate.instant(
                'Voting opened'
            )}`;
        } else if (poll instanceof ViewAssignmentPoll) {
            return `${poll.assignment.getTitle()}: ${this.translate.instant('Ballot opened')}`;
        }
    }

    /**
     * Removes the current banner or replaces it, if a new one is given.
     *
     * @param nextBanner Optional the next banner to show.
     */
    private sliceBanner(nextBanner?: BannerDefinition): void {
        if (nextBanner) {
            this.banner.replaceBanner(this.currentBanner, nextBanner);
        } else {
            this.banner.removeBanner(this.currentBanner);
        }
        this.currentBanner = nextBanner || null;
    }
}
