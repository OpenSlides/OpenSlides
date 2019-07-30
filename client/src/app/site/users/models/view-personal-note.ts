import { BaseViewModel } from 'app/site/base/base-view-model';
import { PersonalNote, PersonalNotesFormat, PersonalNoteContent } from 'app/shared/models/users/personal-note';

export type PersonalNoteTitleInformation = object;

export class ViewPersonalNote extends BaseViewModel<PersonalNote> implements PersonalNoteTitleInformation {
    public static COLLECTIONSTRING = PersonalNote.COLLECTIONSTRING;

    public get personalNote(): PersonalNote {
        return this._model;
    }

    public get userId(): number {
        return this.personalNote.user_id;
    }

    public get notes(): PersonalNotesFormat {
        return this.personalNote.notes;
    }

    public constructor(personalNote: PersonalNote) {
        super(PersonalNote.COLLECTIONSTRING, personalNote);
    }

    public getNoteContent(collection: string, id: number): PersonalNoteContent | null {
        if (this.notes[collection]) {
            return this.notes[collection][id];
        } else {
            return null;
        }
    }
}
