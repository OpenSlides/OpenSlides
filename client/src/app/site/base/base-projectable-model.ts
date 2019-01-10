import { Projectable } from './projectable';
import { BaseViewModel } from './base-view-model';
import { ProjectorOptions } from './projector-options';

/**
 * Base view class for projectable models.
 */
export abstract class BaseProjectableModel extends BaseViewModel implements Projectable {
    /**
     * Per default, a slide does not have any options
     *
     * @override
     */
    public getProjectorOptions(): ProjectorOptions {
        return [];
    }

    /**
     * @override
     */
    public abstract getProjectionDefaultName(): string;

    /**
     * The id should match the model's id.
     *
     * @override
     */
    public getIdForSlide(): number {
        return this.id;
    }

    /**
     * A model s return the collection string
     *
     * @override
     */
    public abstract getNameForSlide(): string;

    /**
     * Per default a model is a non-stable element.
     *
     * @override
     */
    public isStableSlide(): boolean {
        return false;
    }
}
