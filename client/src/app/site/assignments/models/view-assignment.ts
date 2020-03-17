import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Assignment, AssignmentWithoutNestedModels } from 'app/shared/models/assignments/assignment';
import { TitleInformationWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithAgendaItemAndListOfSpeakers } from 'app/site/base/base-view-model-with-agenda-item-and-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { HasViewPolls } from 'app/site/polls/models/has-view-polls';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewAssignmentPoll } from './view-assignment-poll';
import { ViewAssignmentRelatedUser } from './view-assignment-related-user';

export interface AssignmentTitleInformation extends TitleInformationWithAgendaItem {
    title: string;
}

/**
 * A constant containing all possible assignment phases and their different
 * representations as numerical value, string as used in server, and the display
 * name.
 */
export const AssignmentPhases: { name: string; value: number; display_name: string }[] = [
    {
        name: 'PHASE_SEARCH',
        value: 0,
        display_name: 'Searching for candidates'
    },
    {
        name: 'PHASE_VOTING',
        value: 1,
        display_name: 'In the election process'
    },
    {
        name: 'PHASE_FINISHED',
        value: 2,
        display_name: 'Finished'
    }
];

export class ViewAssignment extends BaseViewModelWithAgendaItemAndListOfSpeakers<Assignment>
    implements AssignmentTitleInformation {
    public static COLLECTIONSTRING = Assignment.COLLECTIONSTRING;
    protected _collectionString = Assignment.COLLECTIONSTRING;

    public get assignment(): Assignment {
        return this._model;
    }

    public get candidates(): ViewUser[] {
        if (!this.assignment_related_users) {
            return [];
        }
        return this.assignment_related_users.map(aru => aru.user).filter(x => !!x);
    }

    public get phaseString(): string {
        const phase = AssignmentPhases.find(ap => ap.value === this.assignment.phase);
        return phase ? phase.display_name : '';
    }

    /**
     * @returns true if the assignment is in the 'finished' state
     * (not accepting votes or candidates anymore)
     */
    public get isFinished(): boolean {
        const finishedState = AssignmentPhases.find(ap => ap.name === 'PHASE_FINISHED');
        return this.phase === finishedState.value;
    }

    /**
     * @returns true if the assignment is in the 'searching' state
     */
    public get isSearchingForCandidates(): boolean {
        const searchState = AssignmentPhases.find(ap => ap.name === 'PHASE_SEARCH');
        return this.phase === searchState.value;
    }

    /**
     * @returns the amount of candidates in the assignment's candidate list
     */
    public get candidateAmount(): number {
        return this.assignment_related_users.length;
    }

    public formatForSearch(): SearchRepresentation {
        return { properties: [{ key: 'Title', value: this.getTitle() }], searchValue: [this.getTitle()] };
    }

    public getDetailStateURL(): string {
        return `/assignments/${this.id}`;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: Assignment.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'assignments',
            getDialogTitle: () => this.getTitle()
        };
    }
}
interface IAssignmentRelations extends HasViewPolls<ViewAssignmentPoll> {
    assignment_related_users: ViewAssignmentRelatedUser[];
    tags?: ViewTag[];
    attachments?: ViewMediafile[];
}

export interface ViewAssignment extends AssignmentWithoutNestedModels, IAssignmentRelations {}
