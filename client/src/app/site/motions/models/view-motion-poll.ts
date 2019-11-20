import { MotionPoll, MotionPollWithoutNestedModels } from 'app/shared/models/motions/motion-poll';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMotionOption } from 'app/site/motions/models/view-motion-option';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';

export interface MotionPollTitleInformation {
    title: string;
}

export class ViewMotionPoll extends BaseProjectableViewModel<MotionPoll> implements MotionPollTitleInformation {
    public static COLLECTIONSTRING = MotionPoll.COLLECTIONSTRING;
    protected _collectionString = MotionPoll.COLLECTIONSTRING;

    public get poll(): MotionPoll {
        return this._model;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: MotionPoll.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'motion_poll',
            getDialogTitle: this.getTitle
        };
    }
}

interface TIMotionPollRelations {
    options: ViewMotionOption[];
    voted: ViewUser[];
    groups: ViewGroup[];
}

export interface ViewMotionPoll extends MotionPollWithoutNestedModels, TIMotionPollRelations {}
