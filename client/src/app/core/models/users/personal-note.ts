import { BaseModel } from 'app/core/models/baseModel';

export class PersonalNote extends BaseModel {
    static collectionString = 'users/personal-note';
    id: number;
    notes: Object;
    user_id: number;

    constructor(id: number, notes?: Object, user_id?: number) {
        super(id);
        this.notes = notes;
        this.user_id = user_id;
    }

    public getCollectionString(): string {
        return PersonalNote.collectionString;
    }
}
