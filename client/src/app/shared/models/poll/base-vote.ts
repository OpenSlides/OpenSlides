import { BaseDecimalModel } from '../base/base-decimal-model';

export type VoteValue = 'Y' | 'N' | 'A';

export const VoteValueVerbose = {
    Y: 'Yes',
    N: 'No',
    A: 'Abstain'
};

export const GeneralValueVerbose = {
    votesvalid: 'Valid votes',
    votesinvalid: 'Invalid votes',
    votescast: 'Total votes cast',
    votesno: 'Votes No',
    votesabstain: 'Votes abstain'
};

export abstract class BaseVote<T = any> extends BaseDecimalModel<T> {
    public weight: number;
    public value: VoteValue;
    public option_id: number;
    public user_id?: number;

    public get valueVerbose(): string {
        return VoteValueVerbose[this.value];
    }

    protected getDecimalFields(): string[] {
        return ['weight'];
    }
}
