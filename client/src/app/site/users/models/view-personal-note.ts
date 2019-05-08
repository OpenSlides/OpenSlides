import { BaseViewModel } from 'app/site/base/base-view-model';
import { PersonalNote, PersonalNotesFormat, PersonalNoteContent } from 'app/shared/models/users/personal-note';

export class ViewPersonalNote extends BaseViewModel {
    public static COLLECTIONSTRING = PersonalNote.COLLECTIONSTRING;

    private _personalNote: PersonalNote;

    public get personalNote(): PersonalNote {
        return this._personalNote;
    }

    public get id(): number {
        return this.personalNote.id;
    }

    public get userId(): number {
        return this.personalNote.user_id;
    }

    public get notes(): PersonalNotesFormat {
        return this.personalNote.notes;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(personalNote: PersonalNote) {
        super(PersonalNote.COLLECTIONSTRING);
        this._personalNote = personalNote;
    }

    public getNoteContent(collection: string, id: number): PersonalNoteContent | null {
        if (this.notes[collection]) {
            return this.notes[collection][id];
        } else {
            return null;
        }
    }

    public getTitle = () => {
        return this.personalNote ? this.personalNote.toString() : null;
    };

    public getModel(): PersonalNote {
        return this.personalNote;
    }

    public updateDependencies(update: BaseViewModel): void {}
}
