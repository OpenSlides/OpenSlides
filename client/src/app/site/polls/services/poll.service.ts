import { Injectable } from '@angular/core';

import { _ } from 'app/core/translate/translation-marker';
import { ChartData, ChartType } from 'app/shared/components/charts/charts.component';
import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import { MotionPollMethod } from 'app/shared/models/motions/motion-poll';
import { BasePoll, MajorityMethod, PollColor, PollType } from 'app/shared/models/poll/base-poll';
import { AssignmentPollMethodVerbose } from 'app/site/assignments/models/view-assignment-poll';
import {
    MajorityMethodVerbose,
    PercentBaseVerbose,
    PollPropertyVerbose,
    PollTypeVerbose
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

export interface PollData {
    pollmethod: string;
    onehundred_percent_base: string;
    options: {
        user?: {
            full_name: string;
        };
        yes?: number;
        no?: number;
        abstain?: number;
    }[];
    votesvalid: number;
    votesinvalid: number;
    votescast: number;
}

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
    public abstract defaultPercentBase: string;

    /**
     * The default majority method
     */
    public abstract defaultMajorityMethod: MajorityMethod;

    /**
     * Per default entitled to vote
     */
    public abstract defaultGroupIds: number[];

    /**
     * The majority method currently in use
     */
    public majorityMethod: CalculableMajorityMethod;

    public isElectronicVotingEnabled: boolean;

    /**
     * list of poll keys that are numbers and can be part of a quorum calculation
     */
    public pollValues: CalculablePollKey[] = ['yes', 'no', 'abstain', 'votesvalid', 'votesinvalid', 'votescast'];

    public constructor(constants: ConstantsService) {
        constants
            .get<OpenSlidesSettings>('Settings')
            .subscribe(settings => (this.isElectronicVotingEnabled = settings.ENABLE_ELECTRONIC_VOTING));
    }

    /**
     * Assigns the default poll data to the object. To be extended in subclasses
     * @param poll the poll/object to fill
     */
    public getDefaultPollData(): Partial<BasePoll> {
        return {
            onehundred_percent_base: this.defaultPercentBase,
            majority_method: this.defaultMajorityMethod,
            groups_id: this.defaultGroupIds,
            type: PollType.Analog
        };
    }

    public getVerboseNameForValue(key: string, value: string): string {
        switch (key) {
            case 'majority_method':
                return MajorityMethodVerbose[value];
            case 'onehundred_percent_base':
                return PercentBaseVerbose[value];
            case 'pollmethod':
                return AssignmentPollMethodVerbose[value];
            case 'type':
                return PollTypeVerbose[value];
        }
    }

    public getVerboseNameForKey(key: string): string {
        return PollPropertyVerbose[key];
    }

    public generateChartData(poll: PollData): ChartData {
        if (poll.pollmethod === AssignmentPollMethod.Votes) {
            return this.generateCircleChartData(poll);
        } else {
            return this.generateBarChartData(poll);
        }
    }

    public generateBarChartData(poll: PollData): ChartData {
        const fields = ['yes', 'no'];
        // cast is needed because ViewBasePoll doesn't have the field `pollmethod`, no easy fix :(
        if ((<any>poll).pollmethod === MotionPollMethod.YNA) {
            fields.push('abstain');
        }
        const data: ChartData = fields.map(key => ({
            label: key.toUpperCase(),
            data: poll.options.map(option => option[key]),
            backgroundColor: PollColor[key],
            hoverBackgroundColor: PollColor[key]
        }));

        return data;
    }

    public generateCircleChartData(poll: PollData): ChartData {
        const data: ChartData = poll.options.map(candidate => ({
            label: candidate.user.full_name,
            data: [candidate.yes]
        }));
        return data;
    }

    public getChartType(poll: PollData): ChartType {
        if ((<any>poll).pollmethod === AssignmentPollMethod.Votes) {
            return 'doughnut';
        } else {
            return 'horizontalBar';
        }
    }

    public getChartLabels(poll: PollData): string[] {
        return poll.options.map(candidate => candidate.user.full_name);
    }

    public isVoteDocumented(vote: number): boolean {
        return vote !== null && vote !== undefined && vote !== -2;
    }
}
