import { BaseViewModel } from 'app/site/base/base-view-model';
import { PersonalNote } from 'app/shared/models/users/personal-note';

export class ViewPersonalNote extends BaseViewModel {
    private _personalNote: PersonalNote;

    public get personalNote(): PersonalNote {
        return this._personalNote ? this._personalNote : null;
    }

    public get id(): number {
        return this.personalNote ? this.personalNote.id : null;
    }

    public constructor(personalNote?: PersonalNote) {
        super('Personal note');
        this._personalNote = personalNote;
    }

    public getTitle(): string {
        return this.personalNote ? this.personalNote.toString() : null;
    }

    public updateDependencies(update: BaseViewModel): void {
        throw new Error('Todo');
    }
}
