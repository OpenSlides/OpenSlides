import { BaseModel } from '../base.model';

/**
 * Representation of users personal note.
 * @ignore
 */
export class PersonalNote extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public user_id: number;
    public notes: Object;

    public constructor(id?: number, user_id?: number, notes?: Object) {
        super();
        this._collectionString = 'users/personal-note';
        this.id = id;
        this.user_id = user_id;
        this.notes = notes;
    }

    public getUser(): BaseModel | BaseModel[] {
        return this.DS.get('users/user', this.user_id);
    }
}

BaseModel.registerCollectionElement('users/personal-note', PersonalNote);
