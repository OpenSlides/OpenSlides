import { Injectable } from '@angular/core';

import { _ } from 'app/core/translate/translation-marker';
import { Collection } from 'app/shared/models/base/collection';
import { MajorityMethod, PercentBase, PollType } from 'app/shared/models/poll/base-poll';
import { AssignmentPollMethodsVerbose } from 'app/site/assignments/models/view-assignment-poll';
import {
    MajorityMethodVerbose,
    PercentBaseVerbose,
    PollPropertyVerbose,
    PollTypeVerbose,
    ViewBasePoll
} from 'app/site/polls/models/view-base-poll';
import { ConstantsService } from '../../../core/core-services/constants.service';

/**
 * The possible keys of a poll object that represent numbers.
 * TODO Should be 'key of MotionPoll|AssinmentPoll if type of key is number'
 */
export type CalculablePollKey =
    | 'votesvalid'
    | 'votesinvalid'
    | 'votescast'
    | 'yes'
    | 'no'
    | 'abstain'
    | 'votesno'
    | 'votesabstain';

/**
 * TODO: may be obsolete if the server switches to lower case only
 * (lower case variants are already in CalculablePollKey)
 */
export type PollVoteValue = 'Yes' | 'No' | 'Abstain' | 'Votes';

export const VoteValuesVerbose = {
    Y: 'Yes',
    N: 'No',
    A: 'Abstain'
};

/**
 * Interface representing possible majority calculation methods. The implementing
 * calc function should return an integer number that must be reached for the
 * option to successfully fulfill the quorum, or null if disabled
 */
export interface CalculableMajorityMethod {
    value: string;
    display_name: string;
    calc: (base: number) => number | null;
}

/**
 * Function to round up the passed value of a poll.
 *
 * @param value The calculated value of 100%-base.
 * @param addOne Flag, if the result should be increased by 1.
 *
 * @returns The necessary value to get the majority.
 */
export const calcMajority = (value: number, addOne: boolean = false) => {
    return Math.ceil(value) + (addOne ? 1 : 0);
};

/**
 * List of available majority methods, used in motion and assignment polls
 */
export const PollMajorityMethod: CalculableMajorityMethod[] = [
    {
        value: 'simple_majority',
        display_name: 'Simple majority',
        calc: base => calcMajority(base * 0.5, true)
    },
    {
        value: 'two-thirds_majority',
        display_name: 'Two-thirds majority',
        calc: base => calcMajority((base / 3) * 2)
    },
    {
        value: 'three-quarters_majority',
        display_name: 'Three-quarters majority',
        calc: base => calcMajority((base / 4) * 3)
    },
    {
        value: 'disabled',
        display_name: 'Disabled',
        calc: a => null
    }
];

interface OpenSlidesSettings {
    ENABLE_ELECTRONIC_VOTING: boolean;
}

/**
 * Shared service class for polls. Used by child classes {@link MotionPollService}
 * and {@link AssignmentPollService}
 */
@Injectable({
    providedIn: 'root'
})
export abstract class PollService {
    /**
     * The default percentage base
     */
    public abstract defaultPercentBase: PercentBase;

    /**
     * The default majority method
     */
    public abstract defaultMajorityMethod: MajorityMethod;

    /**
     * The majority method currently in use
     */
    public majorityMethod: CalculableMajorityMethod;

    public isElectronicVotingEnabled: boolean;

    /**
     * list of poll keys that are numbers and can be part of a quorum calculation
     */
    public pollValues: CalculablePollKey[] = ['yes', 'no', 'abstain', 'votesvalid', 'votesinvalid', 'votescast'];

    /**
     * empty constructor
     *
     */
    public constructor(constants: ConstantsService) {
        constants
            .get<OpenSlidesSettings>('Settings')
            .subscribe(settings => (this.isElectronicVotingEnabled = settings.ENABLE_ELECTRONIC_VOTING));
    }

    /**
     * retrieve special labels for a poll value
     * {@link specialPollVotes}. Positive values will return as string
     * representation of themselves
     *
     * @param value check value for special numbers
     * @returns the label for a non-positive value, according to
     */
    public getSpecialLabel(value: number): string {
        // if (value >= 0) {
        //     return value.toString();
        //     // TODO: toLocaleString(lang); but translateService is not usable here, thus lang is not well defined
        // }
        // const vote = this.specialPollVotes.find(special => special[0] === value);
        // return vote ? vote[1] : 'Undocumented special (negative) value';
        return '';
    }

    /**
     * Assigns the default poll data to the object. To be extended in subclasses
     * @param poll the poll/object to fill
     */
    public fillDefaultPollData(poll: Partial<ViewBasePoll> & Collection): void {
        poll.onehundred_percent_base = this.defaultPercentBase;
        poll.majority_method = this.defaultMajorityMethod;
        poll.type = PollType.Analog;
    }

    /**
     * Calculates the percentage the given key reaches.
     *
     * @param poll
     * @param key
     * @returns a percentage number with two digits, null if the value cannot be calculated (consider 0 !== null)
     */
    public calculatePercentage(poll: ViewBasePoll, key: CalculablePollKey): number | null {
        const baseNumber = this.getBaseAmount(poll);
        if (!baseNumber) {
            return null;
        }
        switch (key) {
            case 'abstain':
                if (poll.onehundred_percent_base === PercentBase.YN) {
                    return null;
                }
                break;
            case 'votesinvalid':
                if (poll.onehundred_percent_base !== PercentBase.Cast) {
                    return null;
                }
                break;
            case 'votesvalid':
                if (![PercentBase.Cast, PercentBase.Valid].includes(poll.onehundred_percent_base)) {
                    return null;
                }
                break;
            case 'votescast':
                if (poll.onehundred_percent_base !== PercentBase.Cast) {
                    return null;
                }
        }
        return Math.round(((poll[key] * 100) / baseNumber) * 100) / 100;
    }

    /**
     * Gets the number representing 100 percent for a given MotionPoll, depending
     * on the configuration and the votes given.
     *
     * @param poll
     * @returns the positive number representing 100 percent of the poll, 0 if
     * the base cannot be calculated
     */
    public getBaseAmount(poll: ViewBasePoll): number {
        /*if (!poll) {
            return 0;
        }
        switch (this.percentBase) {
            case 'CAST':
                if (!poll.votescast) {
                    return 0;
                }
                if (poll.votesinvalid < 0) {
                    return 0;
                }
                return poll.votescast;
            case 'VALID':
                if (poll.yes < 0 || poll.no < 0 || poll.abstain < 0) {
                    return 0;
                }
                return poll.votesvalid ? poll.votesvalid : 0;
            case 'YES_NO_ABSTAIN':
                if (poll.yes < 0 || poll.no < 0 || poll.abstain < 0) {
                    return 0;
                }
                return poll.yes + poll.no + poll.abstain;
            case 'YES_NO':
                if (poll.yes < 0 || poll.no < 0 || poll.abstain === -1) {
                    // It is not allowed to set 'Abstain' to 'majority' but exclude it from calculation.
                    // Setting 'Abstain' to 'undocumented' is possible, of course.
                    return 0;
                }
                return poll.yes + poll.no;
        }*/
        return 0;
    }

    /**
     * Calculates which number is needed for the quorum to be surpassed
     * TODO: Methods still hard coded to mirror the server's.
     *
     * @param poll
     * @param method (optional) majority calculation method. If none is given,
     * the default as set in the config will be used.
     * @returns the first integer number larger than the required majority,
     * undefined if a quorum cannot be calculated.
     */
    public calculateQuorum(poll: ViewBasePoll, method?: string): number {
        if (!method) {
            method = this.defaultMajorityMethod;
        }
        const baseNumber = this.getBaseAmount(poll);
        if (!baseNumber) {
            return undefined;
        }
        const calc = PollMajorityMethod.find(m => m.value === method);
        return calc && calc.calc ? calc.calc(baseNumber) : null;
    }

    /**
     * Determines if a value is abstract (percentages cannot be calculated)
     *
     * @param poll
     * @param value
     * @returns true if the percentages should not be calculated
     */
    public isAbstractValue(poll: ViewBasePoll, value: CalculablePollKey): boolean {
        // if (this.getBaseAmount(poll) === 0) {
        //     return true;
        // }
        // switch (this.percentBase) {
        //     case 'YES_NO':
        //         if (['votescast', 'votesinvalid', 'votesvalid', 'abstain'].includes(value)) {
        //             return true;
        //         }
        //         break;
        //     case 'YES_NO_ABSTAIN':
        //         if (['votescast', 'votesinvalid', 'votesvalid'].includes(value)) {
        //             return true;
        //         }
        //         break;
        //     case 'VALID':
        //         if (['votesinvalid', 'votescast'].includes(value)) {
        //             return true;
        //         }
        //         break;
        // }
        // if (poll[value] < 0) {
        //     return true;
        // }
        return false;
    }

    public getVerboseNameForValue(key: string, value: string): string {
        switch (key) {
            case 'majority_method':
                return MajorityMethodVerbose[value];
            case 'onehundred_percent_base':
                return PercentBaseVerbose[value];
            case 'pollmethod':
                return AssignmentPollMethodsVerbose[value];
            case 'type':
                return PollTypeVerbose[value];
        }
    }

    public getVerboseNameForKey(key: string): string {
        return PollPropertyVerbose[key];
    }
}
