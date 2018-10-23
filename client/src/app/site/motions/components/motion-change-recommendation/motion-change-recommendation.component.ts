import { Component, Inject } from '@angular/core';
import { LineRange, ModificationType } from '../../services/diff.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChangeRecommendationRepositoryService } from '../../services/change-recommendation-repository.service';
import { ViewChangeReco } from '../../models/view-change-reco';

/**
 * Data that needs to be provided to the MotionChangeRecommendationComponent dialog
 */
export interface MotionChangeRecommendationComponentData {
    editChangeRecommendation: boolean;
    newChangeRecommendation: boolean;
    lineRange: LineRange;
    changeRecommendation: ViewChangeReco;
}

/**
 * The dialog for creating and editing change recommendations from within the os-motion-detail-component.
 *
 * @example
 * ```ts
 * const data: MotionChangeRecommendationComponentData = {
 *     editChangeRecommendation: false,
 *     newChangeRecommendation: true,
 *     lineRange: lineRange,
 *     motion: this.motion,
 * };
 * this.dialogService.open(MotionChangeRecommendationComponent, {
 *      height: '400px',
 *      width: '600px',
 *      data: data,
 * });
 * ```
 *
 */
@Component({
    selector: 'os-motion-change-recommendation',
    templateUrl: './motion-change-recommendation.component.html',
    styleUrls: ['./motion-change-recommendation.component.scss']
})
export class MotionChangeRecommendationComponent {
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
    public changeReco: ViewChangeReco;

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
            title: 'Replacement'
        },
        {
            value: ModificationType.TYPE_INSERTION,
            title: 'Insertion'
        },
        {
            value: ModificationType.TYPE_DELETION,
            title: 'Deletion'
        }
    ];

    public constructor(
        @Inject(MAT_DIALOG_DATA) public data: MotionChangeRecommendationComponentData,
        private formBuilder: FormBuilder,
        private repo: ChangeRecommendationRepositoryService,
        private dialogRef: MatDialogRef<MotionChangeRecommendationComponent>
    ) {
        this.editReco = data.editChangeRecommendation;
        this.newReco = data.newChangeRecommendation;
        this.changeReco = data.changeRecommendation;
        this.lineRange = data.lineRange;

        this.createForm();
    }

    /**
     * Creates the forms for the Motion and the MotionVersion
     */
    public createForm(): void {
        this.contentForm = this.formBuilder.group({
            text: [this.changeReco.text, Validators.required],
            diffType: [this.changeReco.type, Validators.required]
        });
    }

    public saveChangeRecommendation(): void {
        this.changeReco.updateChangeReco(
            this.contentForm.controls.diffType.value,
            this.contentForm.controls.text.value
        );

        if (this.newReco) {
            this.repo.createByViewModel(this.changeReco).subscribe(response => {
                if (response.id) {
                    this.dialogRef.close(response);
                } else {
                    // @TODO Show an error message
                }
            });
        } else {
            this.repo.update(this.changeReco.changeRecommendation, this.changeReco).subscribe(response => {
                if (response.id) {
                    this.dialogRef.close(response);
                } else {
                    // @TODO Show an error message
                }
            });
        }
    }
}
