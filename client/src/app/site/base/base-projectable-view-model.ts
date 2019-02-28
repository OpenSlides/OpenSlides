import { Projectable, ProjectorElementBuildDeskriptor } from './projectable';
import { BaseViewModel } from './base-view-model';
import { ConfigService } from 'app/core/ui-services/config.service';

/**
 * Base view class for projectable models.
 */
export abstract class BaseProjectableViewModel extends BaseViewModel implements Projectable {
    public abstract getSlide(configService?: ConfigService): ProjectorElementBuildDeskriptor;

    /**
     * @returns the projector title used for managing projector elements.
     */
    public getProjectorTitle = () => {
        return this.getTitle();
    };
}
