import { BaseModel } from './base-model';

export abstract class BaseDecimalModel<T = any> extends BaseModel<T> {
    protected abstract getDecimalFields(): string[];

    public deserialize(input: any): void {
        if (input && typeof input === 'object') {
            this.getDecimalFields().forEach(field => {
                if (input[field] !== undefined) {
                    input[field] = parseInt(input[field], 10);
                }
            });
        }
        super.deserialize(input);
    }
}
