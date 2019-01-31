import { Component, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Subscription } from 'rxjs';

import { BaseComponent } from '../../../../base.component';
import { ViewMotion } from '../../models/view-motion';
import { PersonalNoteService } from 'app/core/ui-services/personal-note.service';
import { PersonalNoteContent } from '../../../../shared/models/users/personal-note';

/**
 * Component for the motion comments view
 */
@Component({
    selector: 'os-personal-note',
    templateUrl: './personal-note.component.html',
    styleUrls: ['./personal-note.component.scss']
})
export class PersonalNoteComponent extends BaseComponent implements OnDestroy {
    /**
     * The motion, which the personal note belong to.
     */
    private _motion: ViewMotion;

    /**
     * Sets the motion. If the motion updates (changes, and so on), the subscription
     * for the personal note will be established.
     */
    @Input()
    public set motion(motion: ViewMotion) {
        this._motion = motion;
        if (this.personalNoteSubscription) {
            this.personalNoteSubscription.unsubscribe();
        }
        if (motion && motion.motion) {
            this.personalNoteSubscription = this.personalNoteService
                .getPersonalNoteObserver(motion.motion)
                .subscribe(pn => {
                    this.personalNote = pn;
                });
        }
    }

    public get motion(): ViewMotion {
        return this._motion;
    }

    /**
     * The edit form for the note
     */
    public personalNoteForm: FormGroup;

    /**
     * Saves, if the users edits the note.
     */
    public isEditMode = false;

    /**
     * The personal note.
     */
    public personalNote: PersonalNoteContent;

    /**
     * The subscription for the personal note.
     */
    private personalNoteSubscription: Subscription;

    public constructor(private personalNoteService: PersonalNoteService, formBuilder: FormBuilder) {
        super();
        this.personalNoteForm = formBuilder.group({
            note: ['']
        });
    }

    /**
     * Sets up the form.
     */
    public editPersonalNote(): void {
        this.personalNoteForm.reset();
        this.personalNoteForm.patchValue({
            note: this.personalNote ? this.personalNote.note : ''
        });
        this.isEditMode = true;
    }

    /**
     * Saves the personal note. If it does not exists, it will be created.
     */
    public async savePersonalNote(): Promise<void> {
        let content: PersonalNoteContent;
        if (this.personalNote) {
            content = Object.assign({}, this.personalNote);
            content.note = this.personalNoteForm.get('note').value;
        } else {
            content = {
                note: this.personalNoteForm.get('note').value,
                star: false
            };
        }
        try {
            await this.personalNoteService.savePersonalNote(this.motion.motion, content);
            this.isEditMode = false;
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Remove the subscription if this component isn't needed anymore.
     */
    public ngOnDestroy(): void {
        if (this.personalNoteSubscription) {
            this.personalNoteSubscription.unsubscribe();
        }
    }
}
