import { Injectable } from '@angular/core';

import { ConfigService } from 'app/core/ui-services/config.service';
import { CalculablePollKey, PollMajorityMethod, PollService } from 'app/core/ui-services/poll.service';
import { MotionPoll } from 'app/shared/models/motions/motion-poll';

/**
 * Service class for motion polls.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionPollService extends PollService {
    /**
     * list of poll keys that are numbers and can be part of a quorum calculation
     */
    public pollValues: CalculablePollKey[] = ['yes', 'no', 'abstain', 'votesvalid', 'votesinvalid', 'votescast'];

    /**
     * Constructor. Subscribes to the configuration values needed
     * @param config ConfigService
     */
    public constructor(config: ConfigService) {
        super();
        config.get<string>('motions_poll_100_percent_base').subscribe(base => (this.percentBase = base));
        config
            .get<string>('motions_poll_default_majority_method')
            .subscribe(method => (this.defaultMajorityMethod = method));
    }

    /**
     * Calculates the percentage the given key reaches.
     *
     * @param poll
     * @param key
     * @returns a percentage number with two digits, null if the value cannot be calculated (consider 0 !== null)
     */
    public calculatePercentage(poll: MotionPoll, key: CalculablePollKey): number | null {
        const baseNumber = this.getBaseAmount(poll);
        if (!baseNumber) {
            return null;
        }
        switch (key) {
            case 'abstain':
                if (this.percentBase === 'YES_NO') {
                    return null;
                }
                break;
            case 'votesinvalid':
                if (this.percentBase !== 'CAST') {
                    return null;
                }
                break;
            case 'votesvalid':
                if (!['CAST', 'VALID'].includes(this.percentBase)) {
                    return null;
                }
                break;
            case 'votescast':
                if (this.percentBase !== 'CAST') {
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
    public getBaseAmount(poll: MotionPoll): number {
        if (!poll) {
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
        }
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
    public calculateQuorum(poll: MotionPoll, method?: string): number {
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
    public isAbstractValue(poll: MotionPoll, value: CalculablePollKey): boolean {
        if (this.getBaseAmount(poll) === 0) {
            return true;
        }
        switch (this.percentBase) {
            case 'YES_NO':
                if (['votescast', 'votesinvalid', 'votesvalid', 'abstain'].includes(value)) {
                    return true;
                }
                break;
            case 'YES_NO_ABSTAIN':
                if (['votescast', 'votesinvalid', 'votesvalid'].includes(value)) {
                    return true;
                }
                break;
            case 'VALID':
                if (['votesinvalid', 'votescast'].includes(value)) {
                    return true;
                }
                break;
        }
        if (poll[value] < 0) {
            return true;
        }
        return false;
    }
}
