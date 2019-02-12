import { BaseViewModel } from 'app/site/base/base-view-model';
import { PersonalNote } from 'app/shared/models/users/personal-note';

export class ViewPersonalNote extends BaseViewModel {
    public static COLLECTIONSTRING = PersonalNote.COLLECTIONSTRING;

    private _personalNote: PersonalNote;

    public get personalNote(): PersonalNote {
        return this._personalNote ? this._personalNote : null;
    }

    public get id(): number {
        return this.personalNote ? this.personalNote.id : null;
    }

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(personalNote?: PersonalNote) {
        super(PersonalNote.COLLECTIONSTRING);
        this._personalNote = personalNote;
    }

    public getTitle = () => {
        return this.personalNote ? this.personalNote.toString() : null;
    };

    public updateDependencies(update: BaseViewModel): void {
        throw new Error('Todo');
    }
}
