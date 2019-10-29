import { BaseDecimalModel } from '../base/base-decimal-model';

export abstract class BaseVote<T> extends BaseDecimalModel<T> {
    public weight: number;
    public value: 'Y' | 'N' | 'A';
    public option_id: number;
    public user_id?: number;

    protected getDecimalFields(): (keyof BaseVote<T>)[] {
        return ['weight'];
    }
}
