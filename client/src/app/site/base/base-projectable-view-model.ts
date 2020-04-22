import { ProjectorTitle } from 'app/core/core-services/projector.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { BaseModel } from 'app/shared/models/base/base-model';
import { BaseViewModel } from './base-view-model';
import { Projectable, ProjectorElementBuildDeskriptor } from './projectable';

/**
 * Base view class for projectable models.
 */
export abstract class BaseProjectableViewModel<M extends BaseModel = any> extends BaseViewModel<M>
    implements Projectable {
    public abstract getSlide(configService?: ConfigService): ProjectorElementBuildDeskriptor;

    /**
     * @returns the projector title used for managing projector elements.
     */
    public getProjectorTitle(): ProjectorTitle {
        return { title: this.getTitle() };
    }
}
