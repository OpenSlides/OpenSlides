import { Assignment } from 'app/shared/models/assignments/assignment';
import { BaseAgendaViewModel } from 'app/site/base/base-agenda-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewAssignmentRelatedUser } from './view-assignment-related-user';
import { ViewAssignmentPoll } from './view-assignment-poll';

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

export class ViewAssignment extends BaseAgendaViewModel {
    public static COLLECTIONSTRING = Assignment.COLLECTIONSTRING;

    private _assignment: Assignment;
    private _assignmentRelatedUsers: ViewAssignmentRelatedUser[];
    private _assignmentPolls: ViewAssignmentPoll[];
    private _agendaItem?: ViewItem;
    private _tags?: ViewTag[];

    public get id(): number {
        return this._assignment ? this._assignment.id : null;
    }

    public get assignment(): Assignment {
        return this._assignment;
    }

    public get polls(): ViewAssignmentPoll[] {
        return this._assignmentPolls;
    }

    public get title(): string {
        return this.assignment.title;
    }

    public get candidates(): ViewUser[] {
        return this._assignmentRelatedUsers.map(aru => aru.user);
    }

    public get assignmentRelatedUsers(): ViewAssignmentRelatedUser[] {
        return this._assignmentRelatedUsers;
    }

    public get agendaItem(): ViewItem | null {
        return this._agendaItem;
    }

    public get tags(): ViewTag[] {
        return this._tags || [];
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
        return this._assignmentRelatedUsers ? this._assignmentRelatedUsers.length : 0;
    }

    /**
     * Constructor. Is set by the repository
     */
    public getVerboseName;
    public getAgendaTitle;
    public getAgendaTitleWithType;

    public constructor(
        assignment: Assignment,
        assignmentRelatedUsers: ViewAssignmentRelatedUser[],
        assignmentPolls: ViewAssignmentPoll[],
        agendaItem?: ViewItem,
        tags?: ViewTag[]
    ) {
        super(Assignment.COLLECTIONSTRING);

        this._assignment = assignment;
        this._assignmentRelatedUsers = assignmentRelatedUsers;
        this._assignmentPolls = assignmentPolls;
        this._agendaItem = agendaItem;
        this._tags = tags;
    }

    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewItem && update.id === this.assignment.agenda_item_id) {
            this._agendaItem = update;
        } else if (update instanceof ViewTag && this.assignment.tags_id.includes(update.id)) {
            const tagIndex = this._tags.findIndex(_tag => _tag.id === update.id);
            if (tagIndex < 0) {
                this._tags.push(update);
            } else {
                this._tags[tagIndex] = update;
            }
        } else if (update instanceof ViewUser) {
            this.assignmentRelatedUsers.forEach(aru => aru.updateDependencies(update));
            this.polls.forEach(poll => poll.updateDependencies(update));
        }
    }

    public getAgendaItem(): ViewItem {
        return this.agendaItem;
    }

    public getTitle = () => {
        return this.title;
    };

    public getModel(): Assignment {
        return this.assignment;
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
