import { Injectable } from '@angular/core';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';

import { ChartData, ChartDate } from 'app/shared/components/charts/charts.component';
import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import {
    BasePoll,
    EntitledUsersEntry,
    MajorityMethod,
    PercentBase,
    PollColor,
    PollState,
    PollType,
    VOTE_UNDOCUMENTED
} from 'app/shared/models/poll/base-poll';
import { ParsePollNumberPipe } from 'app/shared/pipes/parse-poll-number.pipe';
import { PollKeyVerbosePipe } from 'app/shared/pipes/poll-key-verbose.pipe';
import { AssignmentPollMethodVerbose } from 'app/site/assignments/models/view-assignment-poll';
import {
    MajorityMethodVerbose,
    PercentBaseVerbose,
    PollPropertyVerbose,
    PollTypeVerbose,
    ViewBasePoll
} from 'app/site/polls/models/view-base-poll';
import { ConstantsService } from '../../../core/core-services/constants.service';

const PERCENT_DECIMAL_PLACES = 3;
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
        calc: base => calcMajority(base / 2, true)
    },
    {
        value: 'two-thirds_majority',
        display_name: 'Two-thirds majority',
        calc: base => calcMajority((base * 2) / 3)
    },
    {
        value: 'three-quarters_majority',
        display_name: 'Three-quarters majority',
        calc: base => calcMajority((base * 3) / 4)
    },
    {
        value: 'disabled',
        display_name: 'Disabled',
        calc: a => null
    }
];

export interface PollData {
    pollmethod: string;
    type: string;
    state: PollState;
    onehundred_percent_base: string;
    options: PollDataOption[];
    votesvalid: number;
    votesinvalid: number;
    votescast: number;
    entitled_users_at_stop: EntitledUsersEntry[];
    amount_global_yes?: number;
    amount_global_no?: number;
    amount_global_abstain?: number;
}

export interface PollDataOption {
    user?: {
        short_name?: string;
    };
    yes?: number;
    no?: number;
    abstain?: number;
    weight?: number;
}

interface OpenSlidesSettings {
    ENABLE_ELECTRONIC_VOTING: boolean;
}

/**
 * Interface describes the possible data for the result-table.
 */
export interface PollTableData {
    votingOption?: string;
    votingOptionSubtitle?: string;
    class?: string;
    value: VotingResult[];
}

export interface VotingResult {
    vote?:
        | 'yes'
        | 'no'
        | 'abstain'
        | 'votesvalid'
        | 'votesinvalid'
        | 'votescast'
        | 'amount_global_yes'
        | 'amount_global_no'
        | 'amount_global_abstain';
    amount?: number;
    icon?: string;
    hide?: boolean;
    showPercent?: boolean;
}

const PollChartBarThickness = 20;

function isPollTableData(value: any): value is PollTableData {
    if (!value) {
        return false;
    }
    return !!value.votingOption && !!value.value;
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
     * The default poll type
     */
    public abstract defaultPollType: PollType;

    /**
     * The majority method currently in use
     */
    public majorityMethod: CalculableMajorityMethod;

    public isElectronicVotingEnabled: boolean;

    /**
     * list of poll keys that are numbers and can be part of a quorum calculation
     */
    public pollValues: CalculablePollKey[] = ['yes', 'no', 'abstain', 'votesvalid', 'votesinvalid', 'votescast'];

    public constructor(
        constants: ConstantsService,
        protected translate: TranslateService,
        protected pollKeyVerbose: PollKeyVerbosePipe,
        protected parsePollNumber: ParsePollNumberPipe
    ) {
        constants
            .get<OpenSlidesSettings>('Settings')
            .subscribe(settings => (this.isElectronicVotingEnabled = settings.ENABLE_ELECTRONIC_VOTING));
    }

    /**
     * return the total number of votes depending on the selected percent base
     */
    public abstract getPercentBase(poll: PollData, row: PollDataOption): number;

    public getVoteValueInPercent(
        value: number,
        { poll, row }: { poll: PollData; row: PollDataOption | PollTableData }
    ): string | null {
        const option = isPollTableData(row) ? this.transformToOptionData(row) : row;
        const totalByBase = this.getPercentBase(poll, option);
        if (totalByBase && totalByBase > 0) {
            const percentNumber = (value / totalByBase) * 100;
            if (percentNumber >= 0) {
                const result = percentNumber % 1 === 0 ? percentNumber : percentNumber.toFixed(PERCENT_DECIMAL_PLACES);
                return `${result} %`;
            }
        }
        return null;
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
            type: this.isElectronicVotingEnabled ? this.defaultPollType : PollType.Analog
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

    public getVoteTableKeys(poll: PollData | ViewBasePoll): VotingResult[] {
        return [
            {
                vote: 'yes',
                icon: 'thumb_up',
                showPercent: true
            },
            {
                vote: 'no',
                icon: 'thumb_down',
                showPercent: true
            },
            {
                vote: 'abstain',
                icon: 'trip_origin',
                showPercent: this.showAbstainPercent(poll)
            }
        ];
    }

    private showAbstainPercent(poll: PollData | ViewBasePoll): boolean {
        return (
            poll.onehundred_percent_base === PercentBase.YNA ||
            poll.onehundred_percent_base === PercentBase.Valid ||
            poll.onehundred_percent_base === PercentBase.Cast
        );
    }

    public showPercentOfValidOrCast(poll: PollData | ViewBasePoll): boolean {
        return (
            poll.onehundred_percent_base === PercentBase.Valid ||
            poll.onehundred_percent_base === PercentBase.Cast ||
            poll.onehundred_percent_base === PercentBase.Entitled
        );
    }

    public getSumTableKeys(poll: PollData | ViewBasePoll): VotingResult[] {
        return [
            {
                vote: 'votesvalid',
                hide: poll.votesvalid === VOTE_UNDOCUMENTED,
                showPercent: this.showPercentOfValidOrCast(poll)
            },
            {
                vote: 'votesinvalid',
                icon: 'not_interested',
                hide: poll.votesinvalid === VOTE_UNDOCUMENTED || poll.type !== PollType.Analog,
                showPercent: poll.onehundred_percent_base === PercentBase.Cast
            },
            {
                vote: 'votescast',
                hide: poll.votescast === VOTE_UNDOCUMENTED || poll.type !== PollType.Analog,
                showPercent: poll.onehundred_percent_base === PercentBase.Cast
            }
        ];
    }

    public generateChartData(poll: PollData | ViewBasePoll): ChartData {
        const fields = this.getPollDataFields(poll);

        const data: ChartData = fields
            .filter(key => {
                return this.getPollDataFieldsByPercentBase(poll).includes(key);
            })
            .map(key => {
                return {
                    data: this.getResultFromPoll(poll, key),
                    label: key.toUpperCase(),
                    backgroundColor: PollColor[key],
                    hoverBackgroundColor: PollColor[key],
                    barThickness: PollChartBarThickness,
                    maxBarThickness: PollChartBarThickness
                } as ChartDate;
            });

        return data;
    }

    protected getPollDataFields(poll: PollData | ViewBasePoll): CalculablePollKey[] {
        const isAssignment: boolean = (poll as ViewBasePoll).pollClassType === 'assignment';
        return isAssignment ? this.getPollDataFieldsByMethod(poll) : this.getPollDataFieldsByPercentBase(poll);
    }

    protected transformToOptionData(data: PollTableData): PollDataOption {
        const yes = data.value.find(vote => vote.vote === `yes`);
        const no = data.value.find(vote => vote.vote === `no`);
        const abstain = data.value.find(vote => vote.vote === `abstain`);
        return {
            yes: yes?.amount,
            no: no?.amount,
            abstain: abstain?.amount
        };
    }

    private getPollDataFieldsByMethod(poll: PollData | ViewBasePoll): CalculablePollKey[] {
        switch (poll.pollmethod) {
            case AssignmentPollMethod.YNA: {
                return ['yes', 'no', 'abstain'];
            }
            case AssignmentPollMethod.YN: {
                return ['yes', 'no'];
            }
            case AssignmentPollMethod.N: {
                return ['no'];
            }
            default: {
                return ['yes'];
            }
        }
    }

    private getPollDataFieldsByPercentBase(poll: PollData | ViewBasePoll): CalculablePollKey[] {
        switch (poll.onehundred_percent_base) {
            case PercentBase.YN: {
                return ['yes', 'no'];
            }
            case PercentBase.Cast: {
                return ['yes', 'no', 'abstain', 'votesinvalid'];
            }
            default: {
                return ['yes', 'no', 'abstain'];
            }
        }
    }

    /**
     * Extracts yes-no-abstain such as valid, invalids and totals from Poll and PollData-Objects
     */
    private getResultFromPoll(poll: PollData, key: CalculablePollKey): number[] {
        let result: number[];
        if (poll[key]) {
            result = [poll[key]];
        } else {
            result = poll.options.map(option => option[key]);
        }
        return result;
    }

    public isVoteDocumented(vote: number): boolean {
        return vote !== null && vote !== undefined && vote !== VOTE_UNDOCUMENTED;
    }
}
