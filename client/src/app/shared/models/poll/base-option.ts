import { BaseDecimalModel } from '../base/base-decimal-model';

export abstract class BaseOption<T> extends BaseDecimalModel<T> {
    public id: number;
    public yes: number;
    public no: number;
    public abstain: number;
    public poll_id: number;

    protected getDecimalFields(): (keyof BaseOption<T>)[] {
        return ['yes', 'no', 'abstain'];
    }
}
