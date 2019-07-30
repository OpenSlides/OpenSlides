import { Injectable } from '@angular/core';

import { ConfigService } from 'app/core/ui-services/config.service';
import {
    CalculablePollKey,
    MajorityMethod,
    PollMajorityMethod,
    PollService,
    PollVoteValue
} from 'app/core/ui-services/poll.service';
import { AssignmentOptionVote } from 'app/shared/models/assignments/assignment-poll-option';
import { ViewAssignmentPoll } from '../models/view-assignment-poll';
import { ViewAssignmentPollOption } from '../models/view-assignment-poll-option';

type AssignmentPollValues = 'auto' | 'votes' | 'yesnoabstain' | 'yesno';
export type AssignmentPollMethod = 'yn' | 'yna' | 'votes';
export type AssignmentPercentBase = 'YES_NO_ABSTAIN' | 'YES_NO' | 'VALID' | 'CAST' | 'DISABLED';

/**
 * interface common to data in a ViewAssignmentPoll and PollSlideData
 *
 * TODO: simplify
 */
export interface CalculationData {
    pollMethod: AssignmentPollMethod;
    votesno: number;
    votesabstain: number;
    votescast: number;
    votesvalid: number;
    votesinvalid: number;
    percentBase?: AssignmentPercentBase;
    pollOptions?: {
        votes: AssignmentOptionVote[];
    }[];
}

interface CalculationOption {
    votes: AssignmentOptionVote[];
}

/**
 * Vote entries included once for summary (e.g. total votes cast)
 */
export type SummaryPollKey = 'votescast' | 'votesvalid' | 'votesinvalid' | 'votesno' | 'votesabstain';

/**
 * Service class for assignment polls.
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentPollService extends PollService {
    /**
     * list of poll keys that are numbers and can be part of a quorum calculation
     */
    public pollValues: CalculablePollKey[] = ['votesno', 'votesabstain', 'votesvalid', 'votesinvalid', 'votescast'];

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
     *
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
    }

    public getVoteOptionsByPoll(poll: ViewAssignmentPoll): CalculablePollKey[] {
        return this.pollValues.filter(name => poll[name] !== undefined);
    }

    /**
     * Get the base amount for the 100% calculations. Note that some poll methods
     * (e.g. yes/no/abstain may have a different percentage base and will return null here)
     *
     * @param data
     * @returns The amount of votes indicating the 100% base
     */
    public getBaseAmount(data: CalculationData): number | null {
        const percentBase = data.percentBase || this.percentBase;
        switch (percentBase) {
            case 'DISABLED':
                return null;
            case 'YES_NO':
            case 'YES_NO_ABSTAIN':
                if (data.pollMethod === 'votes') {
                    const yes = data.pollOptions.map(option => {
                        const yesValue = option.votes.find(v => v.value === 'Votes');
                        return yesValue ? yesValue.weight : -99;
                    });
                    if (Math.min(...yes) < 0) {
                        return null;
                    } else {
                        // TODO: Counting 'No (and possibly 'Abstain') here?
                        return yes.reduce((a, b) => a + b);
                    }
                } else {
                    return null;
                }
            case 'CAST':
                return data.votescast > 0 && data.votesinvalid >= 0 ? data.votescast : null;
            case 'VALID':
                return data.votesvalid > 0 ? data.votesvalid : null;
            default:
                return null;
        }
    }

    /**
     * Get the percentage for an option
     *
     * @param poll
     * @param data
     * @returns a percentage number with two digits, null if the value cannot be calculated
     */
    public getPercent(data: CalculationData, option: CalculationOption, key: PollVoteValue): number | null {
        const percentBase = data.percentBase || this.percentBase;
        let base = 0;
        if (percentBase === 'DISABLED') {
            return null;
        } else if (percentBase === 'VALID') {
            base = data.votesvalid;
        } else if (percentBase === 'CAST') {
            base = data.votescast;
        } else {
            base = data.pollMethod === 'votes' ? this.getBaseAmount(data) : this.getOptionBaseAmount(data, option);
        }
        if (!base || base < 0) {
            return null;
        }
        const vote = option.votes.find(v => v.value === key);
        if (!vote) {
            return null;
        }
        return Math.round(((vote.weight * 100) / base) * 100) / 100;
    }

    /**
     * get the percentage for a non-abstract per-poll value
     * TODO: similar code to getPercent. Mergeable?
     *
     * @param data
     * @param value a per-poll value (e.g. 'votesvalid')
     * @returns a percentage number with two digits, null if the value cannot be calculated
     */
    public getValuePercent(data: CalculationData, value: CalculablePollKey): number | null {
        const percentBase = data.percentBase || this.percentBase;
        switch (percentBase) {
            case 'YES_NO':
            case 'YES_NO_ABSTAIN':
            case 'DISABLED':
                return null;
            case 'VALID':
                if (value === 'votesinvalid' || value === 'votescast') {
                    return null;
                }
                break;
        }
        const baseAmount = this.getBaseAmount(data);
        if (!baseAmount) {
            return null;
        }
        const amount = data[value];
        if (amount === undefined || amount < 0) {
            return null;
        }
        return Math.round(((amount * 100) / baseAmount) * 100) / 100;
    }

    /**
     * Check if the option in a poll is abstract (percentages should not be calculated)
     *
     * @param data
     * @param option
     * @param key (optional) the key to calculate
     * @returns true if the poll has no percentages, the poll option is a special value,
     * or if the calculations are disabled in the config
     */
    public isAbstractOption(data: CalculationData, option: ViewAssignmentPollOption, key?: PollVoteValue): boolean {
        const percentBase = data.percentBase || this.percentBase;
        if (percentBase === 'DISABLED' || !option.votes || !option.votes.length) {
            return true;
        }
        if (key === 'Abstain' && percentBase === 'YES_NO') {
            return true;
        }
        if (data.pollMethod === 'votes') {
            return this.getBaseAmount(data) > 0 ? false : true;
        } else {
            return option.votes.some(v => v.weight < 0);
        }
    }

    /**
     * Check for abstract (not usable as percentage) options in non-option
     * 'meta' values
     *
     * @param data
     * @param value
     * @returns true if percentages cannot be calculated
     * TODO: Yes, No, etc. in an option will always return true.
     * Use {@link isAbstractOption} for these
     */
    public isAbstractValue(data: CalculationData, value: CalculablePollKey): boolean {
        const percentBase = data.percentBase || this.percentBase;
        if (percentBase === 'DISABLED' || !this.getBaseAmount(data) || !this.pollValues.includes(value)) {
            return true;
        }
        if (percentBase === 'CAST' && data[value] >= 0) {
            return false;
        } else if (percentBase === 'VALID' && value === 'votesvalid' && data[value] > 0) {
            return false;
        }
        return true;
    }

    /**
     * Calculate the base amount inside an option. Only useful if poll method is not 'votes'
     *
     * @param data
     * @param option
     * @returns an positive integer to be used as percentage base, or null
     */
    private getOptionBaseAmount(data: CalculationData, option: CalculationOption): number | null {
        const percentBase = data.percentBase || this.percentBase;
        if (percentBase === 'DISABLED' || data.pollMethod === 'votes') {
            return null;
        } else if (percentBase === 'CAST') {
            return data.votescast > 0 ? data.votescast : null;
        } else if (percentBase === 'VALID') {
            return data.votesvalid > 0 ? data.votesvalid : null;
        }
        const yes = option.votes.find(v => v.value === 'Yes');
        const no = option.votes.find(v => v.value === 'No');
        if (percentBase === 'YES_NO') {
            if (!yes || yes.weight === undefined || !no || no.weight === undefined) {
                return null;
            }
            return yes.weight >= 0 && no.weight >= 0 ? yes.weight + no.weight : null;
        } else if (percentBase === 'YES_NO_ABSTAIN') {
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
     * @param data
     * @param option
     * @returns a positive integer number; may return null if quorum is not calculable
     */
    public yesQuorum(method: MajorityMethod, data: CalculationData, option: ViewAssignmentPollOption): number | null {
        const baseAmount =
            data.pollMethod === 'votes' ? this.getBaseAmount(data) : this.getOptionBaseAmount(data, option);
        return method.calc(baseAmount);
    }

    /**
     * helper function to tuirn a Poll into calculation data for this service
     * TODO: temp until better method to normalize Poll ans PollSlideData is implemented
     *
     * @param poll
     * @returns calculationData ready to be used
     */
    public calculationDataFromPoll(poll: ViewAssignmentPoll): CalculationData {
        return {
            pollMethod: poll.pollmethod,
            votesno: poll.votesno,
            votesabstain: poll.votesabstain,
            votescast: poll.votescast,
            votesinvalid: poll.votesinvalid,
            votesvalid: poll.votesvalid,
            pollOptions: poll.options
        };
    }
}
