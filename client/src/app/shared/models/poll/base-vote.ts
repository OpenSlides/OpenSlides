import { BaseDecimalModel } from '../base/base-decimal-model';

export abstract class BaseVote<T> extends BaseDecimalModel<T> {
    public weight: number;
    public value: 'Y' | 'N' | 'A';
    public user_id?: number;

    protected decimalFields: (keyof BaseVote<T>)[] = ['weight'];
}
