import { Injectable } from '@angular/core';

import { _ } from 'app/core/translate/translation-marker';

/**
 * The possible keys of a poll object that represent numbers.
 * TODO Should be 'key of MotionPoll if type of key is number'
 * TODO: normalize MotionPoll model and other poll models
 * TODO: reuse more motion-poll-service stuff
 */
export type CalculablePollKey = 'votesvalid' | 'votesinvalid' | 'votescast' | 'yes' | 'no' | 'abstain';

/**
 * Shared service class for polls.
 * TODO: For now, motionPolls only. TODO See if reusable for assignment polls etc.
 */
@Injectable({
    providedIn: 'root'
})
export class PollService {
    /**
     * The chosen and currently used base for percentage calculations. Is set by
     * the config service
     */
    public percentBase: string;

    /**
     * The default majority method (as set per config).
     */
    public defaultMajorityMethod: string;

    /**
     * An array of value - label pairs for special value signifiers.
     * TODO: Should be given by the server, and editable. For now: hard coded
     */
    private _specialPollVotes: [number, string][] = [[-1, 'majority'], [-2, 'undocumented']];

    /**
     * getter for the special votes
     *
     * @returns an array of special (non-positive) numbers used in polls and
     * their descriptive strings
     */
    public get specialPollVotes(): [number, string][] {
        return this._specialPollVotes;
    }

    /**
     * empty constructor
     */
    public constructor() {}

    /**
     * Gets an icon for a Poll Key
     *
     * @param key
     * @returns a string for material-icons to represent the icon for
     * this key(e.g. yes: positiv sign, no: negative sign)
     */
    public getIcon(key: CalculablePollKey): string {
        switch (key) {
            case 'yes':
                return 'thumb_up';
            case 'no':
                return 'thumb_down';
            case 'abstain':
                return 'not_interested';
            // case 'votescast':
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
     * @returns A short descriptive name for the poll keys
     */
    public getLabel(key: CalculablePollKey): string {
        switch (key) {
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
     *
     * @param value
     * @returns the label for a non-positive value, according to
     * {@link specialPollVotes}. Positive values will return as string
     * representation of themselves
     */
    public getSpecialLabel(value: number): string {
        if (value >= 0) {
            return value.toString();
        }
        const vote = this.specialPollVotes.find(special => special[0] === value);
        return vote ? vote[1] : 'Undocumented special (negative) value';
    }
}
