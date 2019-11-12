import { BaseDecimalModel } from '../base/base-decimal-model';

export type VoteValue = 'Y' | 'N' | 'A';

export const VoteValueVerbose = {
    Y: 'Yes',
    N: 'No',
    A: 'Abstain'
};

export const GeneralValueVerbose = {
    votesvalid: 'Votes valid',
    votesinvalid: 'Votes invalid',
    votescast: 'Votes cast',
    votesno: 'Votes No',
    votesabstain: 'Votes abstain'
};

export abstract class BaseVote<T> extends BaseDecimalModel<T> {
    public weight: number;
    public value: VoteValue;
    public option_id: number;
    public user_id?: number;

    public get valueVerbose(): string {
        return VoteValueVerbose[this.value];
    }

    protected getDecimalFields(): (keyof BaseVote<T>)[] {
        return ['weight'];
    }
}
