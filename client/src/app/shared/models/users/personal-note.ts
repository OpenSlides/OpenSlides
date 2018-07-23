import { BaseModel } from '../base.model';

/**
 * Representation of users personal note.
 * @ignore
 */
export class PersonalNote extends BaseModel {
    protected _collectionString: string;
    id: number;
    user_id: number;
    notes: Object;

    constructor(id?: number, user_id?: number, notes?: Object) {
        super();
        this._collectionString = 'users/personal-note';
        this.id = id;
        this.user_id = user_id;
        this.notes = notes;
    }

    getUser(): BaseModel | BaseModel[] {
        return this.DS.get('users/user', this.user_id);
    }
}
