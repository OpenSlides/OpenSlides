import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { TitleInformationWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithAgendaItemAndListOfSpeakers } from 'app/site/base/base-view-model-with-agenda-item-and-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
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
        display_name: 'Voting'
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

    private _assignment_related_users?: ViewAssignmentRelatedUser[];
    private _polls?: ViewAssignmentPoll[];
    private _tags?: ViewTag[];
    private _attachments?: ViewMediafile[];

    public get assignment(): Assignment {
        return this._model;
    }

    public get polls(): ViewAssignmentPoll[] {
        return this._polls || [];
    }

    public get title(): string {
        return this.assignment.title;
    }

    public get open_posts(): number {
        return this.assignment.open_posts;
    }

    public get description(): string {
        return this.assignment.description;
    }

    public get candidates(): ViewUser[] {
        return this.assignment_related_users.map(aru => aru.user).filter(x => !!x);
    }

    public get assignment_related_users(): ViewAssignmentRelatedUser[] {
        return this._assignment_related_users || [];
    }

    public get tags(): ViewTag[] {
        return this._tags || [];
    }

    public get tags_id(): number[] {
        return this.assignment.tags_id;
    }

    public get attachments(): ViewMediafile[] {
        return this._attachments || [];
    }

    public get attachments_id(): number[] {
        return this.assignment.attachments_id;
    }

    /**
     * unknown where the identifier to the phase is get
     */
    public get phase(): number {
        return this.assignment.phase;
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
        return this._assignment_related_users ? this._assignment_related_users.length : 0;
    }

    public constructor(assignment: Assignment) {
        super(Assignment.COLLECTIONSTRING, assignment);
    }

    public formatForSearch(): SearchRepresentation {
        return [this.title];
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
