import { BaseModel } from '../base.model';
import { User } from './user';

/**
 * Representation of users personal note.
 * @ignore
 */
export class PersonalNote extends BaseModel {
    public id: number;
    public user_id: number;
    public notes: Object;

    public constructor(input: any) {
        super('users/personal-note', input);
    }

    public getUser(): User {
        return this.DS.get<User>('users/user', this.user_id);
    }

    public toString(): string {
        return this.notes.toString();
    }
}

BaseModel.registerCollectionElement('users/personal-note', PersonalNote);
