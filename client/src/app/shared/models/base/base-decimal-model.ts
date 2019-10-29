import { BaseModel } from './base-model';

export abstract class BaseDecimalModel<T = any> extends BaseModel<T> {
    protected abstract getDecimalFields(): (keyof this)[];

    public deserialize(input: any): void {
        if (input && typeof input === 'object') {
            this.getDecimalFields().forEach(field => (input[field] = parseInt(input[field], 10)));
        }
        super.deserialize(input);
    }
}
