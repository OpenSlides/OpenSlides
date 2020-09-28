import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { LineRange, ModificationType } from 'app/core/ui-services/diff.service';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';

/**
 * Data that needs to be provided to the MotionChangeRecommendationComponent dialog
 */
export interface MotionChangeRecommendationDialogComponentData {
    editChangeRecommendation: boolean;
    newChangeRecommendation: boolean;
    lineRange: LineRange;
    changeRecommendation: ViewMotionChangeRecommendation;
}

/**
 * The dialog for creating and editing change recommendations from within the os-motion-detail-component.
 *
 * @example
 * ```ts
 * const data: MotionChangeRecommendationDialogComponentData = {
 *     editChangeRecommendation: false,
 *     newChangeRecommendation: true,
 *     lineRange: lineRange,
 *     changeReco: this.changeRecommendation,
 * };
 * this.dialogService.open(MotionChangeRecommendationDialogComponent, {
 *      height: '400px',
 *      width: '600px',
 *      data: data,
 * });
 * ```
 *
 */
@Component({
    selector: 'os-motion-change-recommendation',
    templateUrl: './motion-change-recommendation-dialog.component.html',
    styleUrls: ['./motion-change-recommendation-dialog.component.scss']
})
export class MotionChangeRecommendationDialogComponent extends BaseViewComponentDirective {
    /**
     * Determine if the change recommendation is edited
     */
    public editReco = false;

    /**
     * Determine if the change recommendation is new
     */
    public newReco = false;

    /**
     * The change recommendation
     */
    public changeReco: ViewMotionChangeRecommendation;

    /**
     * The line range affected by this change recommendation
     */
    public lineRange: LineRange;

    /**
     * Change recommendation content.
     */
    public contentForm: FormGroup;

    /**
     * The replacement types for the radio group
     * @TODO translate
     */
    public replacementTypes = [
        {
            value: ModificationType.TYPE_REPLACEMENT,
            title: this.translate.instant('Replacement')
        },
        {
            value: ModificationType.TYPE_INSERTION,
            title: this.translate.instant('Insertion')
        },
        {
            value: ModificationType.TYPE_DELETION,
            title: this.translate.instant('Deletion')
        }
    ];

    public constructor(
        @Inject(MAT_DIALOG_DATA) public data: MotionChangeRecommendationDialogComponentData,
        title: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private formBuilder: FormBuilder,
        private repo: ChangeRecommendationRepositoryService,
        private dialogRef: MatDialogRef<MotionChangeRecommendationDialogComponent>
    ) {
        super(title, translate, matSnackBar);

        this.editReco = data.editChangeRecommendation;
        this.newReco = data.newChangeRecommendation;
        this.changeReco = data.changeRecommendation;
        this.lineRange = data.lineRange;

        this.tinyMceSettings.toolbar = `undo redo | bold italic underline strikethrough
            | removeformat | bullist numlist | outdent indent | link charmap code`;

        this.createForm();
    }

    /**
     * Creates the forms for the Motion and the MotionVersion
     */
    public createForm(): void {
        this.contentForm = this.formBuilder.group({
            text: [this.changeReco.text, Validators.required],
            diffType: [this.changeReco.type, Validators.required],
            public: [!this.changeReco.internal]
        });
    }

    public async saveChangeRecommendation(): Promise<void> {
        this.changeReco.updateChangeReco(
            this.contentForm.controls.diffType.value,
            this.contentForm.controls.text.value,
            !this.contentForm.controls.public.value
        );

        try {
            if (this.newReco) {
                await this.repo.createByViewModel(this.changeReco);
                this.dialogRef.close();
            } else {
                await this.repo.update(this.changeReco.changeRecommendation, this.changeReco);
                this.dialogRef.close();
            }
        } catch (e) {
            this.raiseError(e);
        }
    }
}
