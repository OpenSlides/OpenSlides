import { BaseViewModel } from '../../base/base-view-model';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { Tag } from 'app/shared/models/core/tag';
import { User } from 'app/shared/models/users/user';
import { Item } from 'app/shared/models/agenda/item';

export class ViewAssignment extends BaseViewModel {
    private _assignment: Assignment;
    private _relatedUser: User[];
    private _agendaItem: Item;
    private _tags: Tag[];

    public get id(): number {
        return this._assignment ? this._assignment.id : null;
    }

    public get assignment(): Assignment {
        return this._assignment;
    }

    public get candidates(): User[] {
        return this._relatedUser;
    }

    public get agendaItem(): Item {
        return this._agendaItem;
    }

    public get tags(): Tag[] {
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

    public constructor(assignment: Assignment, relatedUser: User[], agendaItem?: Item, tags?: Tag[]) {
        super();
        this._assignment = assignment;
        this._relatedUser = relatedUser;
        this._agendaItem = agendaItem;
        this._tags = tags;
    }

    public updateValues(): void {}

    public getTitle(): string {
        return this.assignment ? this.assignment.title : null;
    }
}
