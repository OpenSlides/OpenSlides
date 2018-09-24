import { BaseModel } from '../../shared/models/base/base-model';
import { Displayable } from '../../shared/models/base/displayable';
import { Identifiable } from '../../shared/models/base/identifiable';

/**
 * Base class for view models. alls view models should have titles.
 */
export abstract class BaseViewModel implements Displayable, Identifiable {
    /**
     * Force children to have an id.
     */
    public abstract id: number;

    public abstract updateValues(update: BaseModel): void;

    public abstract getTitle(): string;

    public getListTitle(): string {
        return this.getTitle();
    }

    public toString(): string {
        return this.getTitle();
    }
}
