import { PersonalNote, PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { BaseViewModel } from 'app/site/base/base-view-model';

export type PersonalNoteTitleInformation = object;

export class ViewPersonalNote extends BaseViewModel<PersonalNote> implements PersonalNoteTitleInformation {
    public static COLLECTIONSTRING = PersonalNote.COLLECTIONSTRING;

    public get personalNote(): PersonalNote {
        return this._model;
    }

    public getNoteContent(collection: string, id: number): PersonalNoteContent | null {
        if (this.notes[collection]) {
            return this.notes[collection][id];
        } else {
            return null;
        }
    }
}
export interface ViewPersonalNote extends PersonalNote {}
