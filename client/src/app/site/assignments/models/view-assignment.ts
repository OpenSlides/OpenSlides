import { Assignment } from 'app/shared/models/assignments/assignment';
import { BaseAgendaViewModel } from 'app/site/base/base-agenda-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewAssignment extends BaseAgendaViewModel {
    private _assignment: Assignment;
    private _relatedUser: ViewUser[];
    private _agendaItem: ViewItem;
    private _tags: ViewTag[];

    public get id(): number {
        return this._assignment ? this._assignment.id : null;
    }

    public get assignment(): Assignment {
        return this._assignment;
    }

    public get candidates(): ViewUser[] {
        return this._relatedUser;
    }

    public get agendaItem(): ViewItem {
        return this._agendaItem;
    }

    public get tags(): ViewTag[] {
        return this._tags;
    }

    /**
     * unknown where the identifier to the phase is get
     */
    public get phase(): number {
        return this.assignment ? this.assignment.phase : null;
    }

    public get candidateAmount(): number {
        return this.candidates ? this.candidates.length : 0;
    }

    public constructor(assignment: Assignment, relatedUser?: ViewUser[], agendaItem?: ViewItem, tags?: ViewTag[]) {
        super('Election');
        this._assignment = assignment;
        this._relatedUser = relatedUser;
        this._agendaItem = agendaItem;
        this._tags = tags;
    }

    public updateDependencies(update: BaseViewModel): void {
        console.log('TODO: assignment updateDependencies');
    }

    public getAgendaItem(): ViewItem {
        return this.agendaItem;
    }

    public getTitle(): string {
        return this.assignment.title;
    }

    public formatForSearch(): SearchRepresentation {
        throw new Error('TODO');
    }

    public getDetailStateURL(): string {
        return 'TODO';
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        throw new Error('TODO');
    }
}
