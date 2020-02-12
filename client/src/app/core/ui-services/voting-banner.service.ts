import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

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
        const pollsToVote = polls.filter(poll => this.votingService.canVote(poll) && !poll.user_has_voted_valid);
        if ((this.OSStatus.isInHistoryMode && this.currentBanner) || !pollsToVote.length) {
            this.sliceBanner();
            return;
        }

        const banner =
            pollsToVote.length === 1
                ? this.createBanner(this.getTextForPoll(pollsToVote[0]), pollsToVote[0].parentLink)
                : this.createBanner(
                      `${this.translate.instant('You have polls to vote on')}: ${pollsToVote.length}`,
                      '/polls/'
                  );
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
        return poll instanceof ViewMotionPoll
            ? `${this.translate.instant('Motion') + ' ' + poll.motion.getIdentifierOrTitle()}: ${this.translate.instant(
                  'Voting is open'
              )}`
            : `${poll.getTitle()}: ${this.translate.instant('Ballot is open')}`;
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
