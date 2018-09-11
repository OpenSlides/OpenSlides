import { BaseModel } from '../../shared/models/base/base-model';
import { Displayable } from '../../shared/models/base/displayable';

/**
 * Base class for view models. alls view models should have titles.
 */
export abstract class BaseViewModel implements Displayable {
    public abstract updateValues(update: BaseModel): void;

    public abstract getTitle(): string;

    public getListTitle(): string {
        return this.getTitle();
    }

    public toString(): string {
        return this.getTitle();
    }
}
