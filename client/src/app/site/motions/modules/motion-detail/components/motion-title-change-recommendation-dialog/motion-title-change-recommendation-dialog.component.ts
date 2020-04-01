import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { ModificationType } from 'app/core/ui-services/diff.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotionChangeRecommendation } from 'app/site/motions/models/view-motion-change-recommendation';

/**
 * Data that needs to be provided to the MotionTitleChangeRecommendationComponent dialog
 */
export interface MotionTitleChangeRecommendationDialogComponentData {
    editChangeRecommendation: boolean;
    newChangeRecommendation: boolean;
    changeRecommendation: ViewMotionChangeRecommendation;
}

/**
 * The dialog for creating and editing title change recommendations from within the os-motion-detail-component.
 *
 * @example
 * ```ts
 * const data: MotionTitleChangeRecommendationDialogComponentData = {
 *     editChangeRecommendation: false,
 *     newChangeRecommendation: true,
 *     changeReco: this.changeRecommendation,
 * };
 * this.dialogService.open(MotionTitleChangeRecommendationDialogComponent, {
 *      height: '400px',
 *      width: '600px',
 *      data: data,
 * });
 * ```
 */
@Component({
    selector: 'os-title-motion-change-recommendation-dialog',
    templateUrl: './motion-title-change-recommendation-dialog.component.html',
    styleUrls: ['./motion-title-change-recommendation-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MotionTitleChangeRecommendationDialogComponent extends BaseViewComponent {
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
     * Change recommendation content.
     */
    public contentForm: FormGroup;

    public constructor(
        @Inject(MAT_DIALOG_DATA) public data: MotionTitleChangeRecommendationDialogComponentData,
        title: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private formBuilder: FormBuilder,
        private repo: ChangeRecommendationRepositoryService,
        private dialogRef: MatDialogRef<MotionTitleChangeRecommendationDialogComponent>
    ) {
        super(title, translate, matSnackBar);

        this.editReco = data.editChangeRecommendation;
        this.newReco = data.newChangeRecommendation;
        this.changeReco = data.changeRecommendation;

        this.createForm();
    }

    /**
     * Creates the forms for the Motion and the MotionVersion
     */
    public createForm(): void {
        this.contentForm = this.formBuilder.group({
            title: [this.changeReco.text, Validators.required],
            public: [!this.changeReco.internal]
        });
    }

    public async saveChangeRecommendation(): Promise<void> {
        this.changeReco.updateChangeReco(
            ModificationType.TYPE_REPLACEMENT,
            this.contentForm.controls.title.value,
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
