import { Displayable } from '../../shared/models/base/displayable';
import { Identifiable } from '../../shared/models/base/identifiable';
import { Deserializable } from 'app/shared/models/base/deserializable';

/**
 * Base class for view models. alls view models should have titles.
 */
export abstract class BaseViewModel implements Displayable, Identifiable {
    /**
     * Force children to have an id.
     */
    public abstract id: number;

    public abstract updateValues(update: Deserializable): void;

    public abstract getTitle(): string;

    public getListTitle(): string {
        return this.getTitle();
    }

    public toString(): string {
        return this.getTitle();
    }
}
