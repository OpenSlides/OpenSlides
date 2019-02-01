import { Projectable, ProjectorElementBuildDeskriptor } from './projectable';
import { BaseViewModel } from './base-view-model';

/**
 * Base view class for projectable models.
 */
export abstract class BaseProjectableViewModel extends BaseViewModel implements Projectable {
    public constructor(verboseName: string) {
        super(verboseName);
    }

    public abstract getSlide(): ProjectorElementBuildDeskriptor;
}
