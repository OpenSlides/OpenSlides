import { BaseModel } from '../base/base-model';

/**
 * The content every personal note has.
 */
export interface PersonalNoteContent {
    /**
     * Users can star content to mark as favorite.
     */
    star: boolean;

    /**
     * Users can save their notes.
     */
    note: string;
}

/**
 * All notes are assigned to their object (given by collection string and id)
 */
export interface PersonalNotesFormat {
    [collectionString: string]: {
        [id: number]: PersonalNoteContent;
    };
}

/**
 * The base personal note object.
 */
export interface PersonalNoteObject {
    /**
     * Every personal note object has an id.
     */
    id: number;

    /**
     * The user for the object.
     */
    user_id: number;

    /**
     * The actual notes arranged in a specific format.
     */
    notes: PersonalNotesFormat;
}

/**
 * Representation of users personal note.
 * @ignore
 */
export class PersonalNote extends BaseModel<PersonalNote> implements PersonalNoteObject {
    public static COLLECTIONSTRING = 'users/personal-note';

    public id: number;
    public user_id: number;
    public notes: PersonalNotesFormat;

    public constructor(input: Partial<PersonalNote>) {
        super(PersonalNote.COLLECTIONSTRING, input);
    }
}
