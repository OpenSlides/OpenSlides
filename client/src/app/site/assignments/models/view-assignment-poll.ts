import { AssignmentPoll, AssignmentPollWithoutNestedModels } from 'app/shared/models/assignments/assignment-poll';
import { AssignmentPollOption } from 'app/shared/models/assignments/assignment-poll-option';
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

    /**
     * Creates a copy with deep-copy on all changing numerical values,
     * but intact uncopied references to the users
     *
     * TODO: This MUST NOT be done this way. Do not create ViewModels on your own...
     */
    public copy(): ViewAssignmentPoll {
        const poll = new ViewAssignmentPoll(new AssignmentPoll(JSON.parse(JSON.stringify(this.poll))));
        (<any>poll)._options = this.options.map(option => {
            const polloption = new ViewAssignmentPollOption(
                new AssignmentPollOption(JSON.parse(JSON.stringify(option.option)))
            );
            (<any>polloption)._user = option.user;
            return polloption;
        });
        return poll;
    }
}

export interface ViewAssignmentPoll extends AssignmentPollWithoutNestedModels {
    options: ViewAssignmentPollOption[];
}
