import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { PersonalNoteService } from 'app/core/ui-services/personal-note.service';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { MotionPdfExportService } from 'app/site/motions/services/motion-pdf-export.service';

/**
 * Component for the motion comments view
 */
@Component({
    selector: 'os-personal-note',
    templateUrl: './personal-note.component.html',
    styleUrls: ['./personal-note.component.scss']
})
export class PersonalNoteComponent extends BaseViewComponentDirective {
    /**
     * The motion, which the personal note belong to.
     */
    @Input()
    public motion: ViewMotion;

    /**
     * The edit form for the note
     */
    public personalNoteForm: FormGroup;

    /**
     * Saves, if the users edits the note.
     */
    public isEditMode = false;

    public get personalNoteText(): string {
        return this.motion.personalNoteText;
    }

    /**
     * Constructor. Creates form
     *
     * @param personalNoteService
     * @param formBuilder
     * @param pdfService
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private personalNoteService: PersonalNoteService,
        formBuilder: FormBuilder,
        private pdfService: MotionPdfExportService
    ) {
        super(title, translate, matSnackBar);
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
            note: this.motion.personalNote ? this.motion.personalNote.note : ''
        });
        this.isEditMode = true;
    }

    /**
     * Saves the personal note. If it does not exists, it will be created.
     */
    public async savePersonalNote(): Promise<void> {
        let content: PersonalNoteContent;
        if (this.motion.personalNote) {
            content = Object.assign({}, this.motion.personalNote);
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
            this.raiseError(e);
        }
    }

    /**
     * Triggers a pdf export of the personal note
     */
    public printPersonalNote(): void {
        this.pdfService.exportPersonalNote(this.motion.personalNote, this.motion);
    }
}
