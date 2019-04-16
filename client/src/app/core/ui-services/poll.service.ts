import { Injectable } from '@angular/core';

import { _ } from 'app/core/translate/translation-marker';

/**
 * The possible keys of a poll object that represent numbers.
 * TODO Should be 'key of MotionPoll|AssinmentPoll if type of key is number'
 */
export type CalculablePollKey = 'votesvalid' | 'votesinvalid' | 'votescast' | 'yes' | 'no' | 'abstain';

/**
 * TODO: may be obsolete if the server switches to lower case only
 * (lower case variants are already in CalculablePollKey)
 */
export type PollVoteValue = 'Yes' | 'No' | 'Abstain' | 'Votes';

/**
 * Interface representing possible majority calculation methods. The implementing
 * calc function should return an integer number that must be reached for the
 * option to successfully fulfill the quorum, or null if disabled
 */
export interface MajorityMethod {
    value: string;
    display_name: string;
    calc: (base: number) => number | null;
}

/**
 * List of available majority methods, used in motion and assignment polls
 */
export const PollMajorityMethod: MajorityMethod[] = [
    {
        value: 'simple_majority',
        display_name: 'Simple majority',
        calc: base => {
            const q = base * 0.5;
            return Number.isInteger(q) ? q + 1 : Math.ceil(q);
        }
    },
    {
        value: 'two-thirds_majority',
        display_name: 'Two-thirds majority',
        calc: base => {
            const q = (base / 3) * 2;
            return Number.isInteger(q) ? q + 1 : Math.ceil(q);
        }
    },
    {
        value: 'three-quarters_majority',
        display_name: 'Three-quarters majority',
        calc: base => {
            const q = (base / 4) * 3;
            return Number.isInteger(q) ? q + 1 : Math.ceil(q);
        }
    },
    {
        value: 'disabled',
        display_name: 'Disabled',
        calc: a => null
    }
];

/**
 * Shared service class for polls. Used by child classes {@link MotionPollService}
 * and {@link AssignmentPollService}
 */
@Injectable({
    providedIn: 'root'
})
export abstract class PollService {
    /**
     * The chosen and currently used base for percentage calculations. Is
     * supposed to be set by a config service
     */
    public percentBase: string;

    /**
     * The default majority method (to be set set per config).
     */
    public defaultMajorityMethod: string;

    /**
     * The majority method currently in use
     */
    public majorityMethod: MajorityMethod;

    /**
     * An array of value - label pairs for special value signifiers.
     * TODO: Should be given by the server, and editable. For now they are hard
     * coded
     */
    private _specialPollVotes: [number, string][] = [[-1, 'majority'], [-2, 'undocumented']];

    /**
     * getter for the special vote values
     *
     * @returns an array of special (non-positive) numbers used in polls and
     * their descriptive strings
     */
    public get specialPollVotes(): [number, string][] {
        return this._specialPollVotes;
    }

    /**
     * empty constructor
     *
     */
    public constructor() {}

    /**
     * Gets an icon for a Poll Key
     *
     * @param key yes, no, abstain or something like that
     * @returns a string for material-icons to represent the icon for
     * this key(e.g. yes: positive sign, no: negative sign)
     */
    public getIcon(key: CalculablePollKey): string {
        switch (key) {
            case 'yes':
                return 'thumb_up';
            case 'no':
                return 'thumb_down';
            case 'abstain':
                return 'not_interested';
            // TODO case 'votescast':
            // sum
            case 'votesvalid':
                return 'check';
            case 'votesinvalid':
                return 'cancel';
            default:
                return '';
        }
    }

    /**
     * Gets a label for a poll Key
     *
     * @param key yes, no, abstain or something like that
     * @returns A short descriptive name for the poll keys
     */
    public getLabel(key: CalculablePollKey | PollVoteValue): string {
        switch (key.toLowerCase()) {
            case 'yes':
                return 'Yes';
            case 'no':
                return 'No';
            case 'abstain':
                return 'Abstain';
            case 'votescast':
                return _('Total votes cast');
            case 'votesvalid':
                return _('Valid votes');
            case 'votesinvalid':
                return _('Invalid votes');
            default:
                return '';
        }
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
        if (value >= 0) {
            return value.toString();
        }
        const vote = this.specialPollVotes.find(special => special[0] === value);
        return vote ? vote[1] : 'Undocumented special (negative) value';
    }

    /**
     * Get the progress bar class for a decision key
     *
     * @param key a calculable poll key (like yes or no)
     * @returns a css class designing a progress bar in a color, or an empty string
     */
    public getProgressBarColor(key: CalculablePollKey | PollVoteValue): string {
        switch (key.toLowerCase()) {
            case 'yes':
                return 'progress-green';
            case 'no':
                return 'progress-red';
            case 'abstain':
                return 'progress-yellow';
            case 'votes':
                return 'progress-green';
            default:
                return '';
        }
    }
}
