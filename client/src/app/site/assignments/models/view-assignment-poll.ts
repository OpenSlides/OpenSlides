import { AssignmentPoll, AssignmentPollWithoutNestedModels } from 'app/shared/models/assignments/assignment-poll';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewAssignmentPollOption } from './view-assignment-poll-option';

export class ViewAssignmentPoll extends BaseProjectableViewModel<AssignmentPoll> {
    public static COLLECTIONSTRING = AssignmentPoll.COLLECTIONSTRING;
    protected _collectionString = AssignmentPoll.COLLECTIONSTRING;

    public get poll(): AssignmentPoll {
        return this._model;
    }

    public getListTitle = () => {
        return this.getTitle();
    };

    public getProjectorTitle = () => {
        return this.getTitle();
    };

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: 'assignments/poll',
                assignment_id: this.assignment_id,
                poll_id: this.id,
                getIdentifiers: () => ['name', 'assignment_id', 'poll_id']
            }),
            slideOptions: [],
            projectionDefaultName: 'assignments',
            getDialogTitle: () => 'TODO'
        };
    }
}

export interface ViewAssignmentPoll extends AssignmentPollWithoutNestedModels {
    options: ViewAssignmentPollOption[];
}
