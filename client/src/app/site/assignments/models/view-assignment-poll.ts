import { AssignmentPoll, AssignmentPollWithoutNestedModels } from 'app/shared/models/assignments/assignment-poll';
import { BaseProjectableViewModel } from 'app/site/base/base-projectable-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewAssignmentOption } from './view-assignment-option';

export interface AssignmentPollTitleInformation {
    title: string;
}

export class ViewAssignmentPoll extends BaseProjectableViewModel<AssignmentPoll>
    implements AssignmentPollTitleInformation {
    public static COLLECTIONSTRING = AssignmentPoll.COLLECTIONSTRING;
    protected _collectionString = AssignmentPoll.COLLECTIONSTRING;

    public get poll(): AssignmentPoll {
        return this._model;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: AssignmentPoll.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'assignment_poll',
            getDialogTitle: this.getTitle
        };
    }
}

interface TIAssignmentPollRelations {
    options: ViewAssignmentOption[];
    voted: ViewUser[];
    groups: ViewGroup[];
}

export interface ViewAssignmentPoll extends AssignmentPollWithoutNestedModels, TIAssignmentPollRelations {}
