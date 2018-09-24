import { BaseModel } from '../base/base-model';

/**
 * Representation of users personal note.
 * @ignore
 */
export class PersonalNote extends BaseModel<PersonalNote> {
    public id: number;
    public user_id: number;
    public notes: Object;

    public constructor(input: any) {
        super('users/personal-note', input);
    }

    public getTitle(): string {
        return 'Personal note';
    }
}

BaseModel.registerCollectionElement('users/personal-note', PersonalNote);
