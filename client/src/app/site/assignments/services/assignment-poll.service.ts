import { Injectable } from '@angular/core';

import { ConfigService } from 'app/core/ui-services/config.service';
import {
    PollService,
    PollMajorityMethod,
    MajorityMethod,
    CalculablePollKey,
    PollVoteValue
} from 'app/core/ui-services/poll.service';
import { Poll } from 'app/shared/models/assignments/poll';
import { PollOption } from 'app/shared/models/assignments/poll-option';

type AssignmentPollValues = 'auto' | 'votes' | 'yesnoabstain' | 'yesno';
export type AssignmentPollMethod = 'yn' | 'yna' | 'votes';
type AssignmentPercentBase = 'YES_NO_ABSTAIN' | 'YES_NO' | 'VALID' | 'CAST' | 'DISABLED';

/**
 * Service class for motion polls.
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentPollService extends PollService {
    /**
     * list of poll keys that are numbers and can be part of a quorum calculation
     */
    public pollValues: CalculablePollKey[] = ['votesvalid', 'votesinvalid', 'votescast'];

    /**
     * the method used for polls (as per config)
     */
    public pollMethod: AssignmentPollValues;

    /**
     * the method used to determine the '100%' base (set in config)
     */
    public percentBase: AssignmentPercentBase;

    /**
     * convenience function for displaying the available majorities
     */
    public get majorityMethods(): MajorityMethod[] {
        return PollMajorityMethod;
    }

    /**
     * Constructor. Subscribes to the configuration values needed
     * @param config ConfigService
     */
    public constructor(config: ConfigService) {
        super();
        config
            .get<string>('assignments_poll_default_majority_method')
            .subscribe(method => (this.defaultMajorityMethod = method));
        config
            .get<AssignmentPollValues>('assignments_poll_vote_values')
            .subscribe(method => (this.pollMethod = method));
        config
            .get<AssignmentPercentBase>('assignments_poll_100_percent_base')
            .subscribe(base => (this.percentBase = base));
        // assignments_add_candidates_to_list_of_speakers boolean
    }

    /**
     * Get the base amount for the 100% calculations. Note that some poll methods
     * (e.g. yes/no/abstain may have a diffferent percentage base and will return null here)
     *
     * @param poll
     * @returns The amount of votes indicating the 100% base
     */
    public getBaseAmount(poll: Poll): number | null {
        switch (this.percentBase) {
            case 'DISABLED':
                return null;
            case 'YES_NO':
            case 'YES_NO_ABSTAIN':
                if (poll.pollmethod === 'votes') {
                    const yes = poll.options.map(cand => {
                        const yesValue = cand.votes.find(v => v.value === 'Yes');
                        return yesValue ? yesValue.weight : -99;
                    });
                    if (Math.min(...yes) < 0) {
                        return null;
                    } else {
                        return yes.reduce((a, b) => a + b);
                    }
                } else {
                    return null;
                }
            case 'CAST':
                return poll.votescast > 0 && poll.votesinvalid >= 0 ? poll.votescast : null;
            case 'VALID':
                return poll.votesvalid > 0 ? poll.votesvalid : null;
            default:
                return null;
        }
    }

    /**
     * Get the percentage for an option
     *
     * @param poll
     * @param option
     * @param value
     * @returns a percentage number with two digits, null if the value cannot be calculated
     */
    public getPercent(poll: Poll, option: PollOption, value: PollVoteValue): number | null {
        const base = poll.pollmethod === 'votes' ? poll.pollBase : this.getOptionBaseAmount(poll, option);
        if (!base) {
            return null;
        }
        const vote = option.votes.find(v => v.value === value);
        if (!vote) {
            return null;
        }
        return Math.round(((vote.weight * 100) / base) * 100) / 100;
    }

    /**
     * Check if the option in a poll is abstract (percentages should not be calculated)
     *
     * @returns true if the poll has no percentages, the poll option is a special value,
     * or if the calculations are disabled in the config
     */
    public isAbstractOption(poll: Poll, option: PollOption): boolean {
        if (!option.votes || !option.votes.length) {
            return true;
        }
        if (poll.pollmethod === 'votes') {
            return poll.pollBase ? false : true;
        } else {
            return option.votes.some(v => v.weight < 0);
        }
    }

    /**
     * Check for abstract (not usable as percentage) options in non-option
     * 'meta' values
     *
     * @param poll
     * @param value
     * @returns true if percentages cannot be calculated
     * TODO: Yes, No, etc. in an option will always return true.
     * Use {@link isAbstractOption} for these
     */
    public isAbstractValue(poll: Poll, value: CalculablePollKey): boolean {
        if (!poll.pollBase || !this.pollValues.includes(value)) {
            return true;
        }
        if (this.percentBase === 'CAST' && poll[value] >= 0) {
            return false;
        } else if (this.percentBase === 'VALID' && value === 'votesvalid' && poll[value] > 0) {
            return false;
        }
        return true;
    }

    /**
     * Calculate the base amount inside an option. Only useful if poll method is not 'votes'
     *
     * @returns an positive integer to be used as percentage base, or null
     */
    private getOptionBaseAmount(poll: Poll, option: PollOption): number | null {
        if (poll.pollmethod === 'votes') {
            return null;
        }
        const yes = option.votes.find(v => v.value === 'Yes');
        const no = option.votes.find(v => v.value === 'No');
        if (poll.pollmethod === 'yn') {
            if (!yes || yes.weight === undefined || !no || no.weight === undefined) {
                return null;
            }
            return yes.weight >= 0 && no.weight >= 0 ? yes.weight + no.weight : null;
        } else {
            const abstain = option.votes.find(v => v.value === 'Abstain');
            if (!abstain || abstain.weight === undefined) {
                return null;
            }
            return yes.weight >= 0 && no.weight >= 0 && abstain.weight >= 0
                ? yes.weight + no.weight + abstain.weight
                : null;
        }
    }

    /**
     * Get the minimum amount of votes needed for an option to pass the quorum
     *
     * @param method
     * @param poll
     * @param option
     * @returns a positive integer number; may return null if quorum is not calculable
     */
    public yesQuorum(method: MajorityMethod, poll: Poll, option: PollOption): number | null {
        const baseAmount = poll.pollmethod === 'votes' ? poll.pollBase : this.getOptionBaseAmount(poll, option);
        return method.calc(baseAmount);
    }
}
