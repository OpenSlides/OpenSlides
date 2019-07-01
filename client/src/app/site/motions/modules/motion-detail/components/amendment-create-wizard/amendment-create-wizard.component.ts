import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { ConfigService } from 'app/core/ui-services/config.service';
import { CreateMotion } from 'app/site/motions/models/create-motion';
import { MotionRepositoryService, ParagraphToChoose } from 'app/core/repositories/motions/motion-repository.service';
import { ViewMotion } from 'app/site/motions/models/view-motion';

/**
 * The wizard used to create a new amendment based on a motion.
 */
@Component({
    selector: 'os-amendment-create-wizard',
    templateUrl: './amendment-create-wizard.component.html',
    styleUrls: ['./amendment-create-wizard.component.scss']
})
export class AmendmentCreateWizardComponent extends BaseViewComponent {
    /**
     * The motion to be amended
     */
    public motion: ViewMotion;

    /**
     * The paragraphs of the base motion
     */
    public paragraphs: ParagraphToChoose[];

    /**
     * Change recommendation content.
     */
    public contentForm: FormGroup;

    /**
     * Indicates the maximum line length as defined in the configuration.
     */
    public lineLength: number;

    /**
     * Determine, from the config service, if a reason is required
     */
    public reasonRequired: boolean;

    /**
     * Indicates if an amendment can change multiple paragraphs or only one
     */
    public multipleParagraphsAllowed: boolean;

    /**
     * Constructs this component.
     *
     * @param {Title} titleService set the browser title
     * @param {TranslateService} translate the translation service
     * @param {ConfigService} configService The configuration provider
     * @param {FormBuilder} formBuilder Form builder
     * @param {MotionRepositoryService} repo Motion Repository
     * @param {ActivatedRoute} route The activated route
     * @param {Router} router The router
     * @param {MatSnackBar} matSnackBar Material Design SnackBar
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        private configService: ConfigService,
        private formBuilder: FormBuilder,
        private repo: MotionRepositoryService,
        private route: ActivatedRoute,
        private router: Router,
        matSnackBar: MatSnackBar
    ) {
        super(titleService, translate, matSnackBar);
        this.createForm();

        this.configService.get<number>('motions_line_length').subscribe(lineLength => {
            this.lineLength = lineLength;
            this.getMotionByUrl();
        });

        this.configService.get<boolean>('motions_reason_required').subscribe(required => {
            this.reasonRequired = required;
        });

        this.configService.get<boolean>('motions_amendments_multiple_paragraphs').subscribe(allowed => {
            this.multipleParagraphsAllowed = allowed;
        });
    }

    /**
     * determine the motion to display using the URL
     */
    public getMotionByUrl(): void {
        // load existing motion
        this.route.params.subscribe(params => {
            this.repo.getViewModelObservable(params.id).subscribe(newViewMotion => {
                this.motion = newViewMotion;
                this.paragraphs = this.repo.getParagraphsToChoose(newViewMotion, this.lineLength);
            });
        });
    }

    /**
     * Creates the forms for the Motion and the MotionVersion
     */
    public createForm(): void {
        this.contentForm = this.formBuilder.group({
            selectedParagraphs: [[], Validators.required],
            reason: ['', Validators.required]
        });
    }

    public isParagraphSelected(paragraph: ParagraphToChoose): boolean {
        return !!this.contentForm.value.selectedParagraphs.find(para => para.paragraphNo === paragraph.paragraphNo);
    }

    /**
     * Function to prevent executing the click event of a checkbox.
     * This prevents that the state of the checkbox is not changed by clicking it.
     *
     * @param event The `MouseEvent`
     */
    public checkboxClicked(event: MouseEvent): void {
        event.preventDefault();
    }

    /**
     * Called by the template when a paragraph is clicked in single paragraph mode.
     * Behaves like a radio-button
     *
     * @param {ParagraphToChoose} paragraph
     */
    public setParagraph(paragraph: ParagraphToChoose): void {
        this.contentForm.value.selectedParagraphs.forEach(para => {
            this.contentForm.removeControl('text_' + para.paragraphNo);
        });
        this.contentForm.addControl(
            'text_' + paragraph.paragraphNo,
            new FormControl(paragraph.rawHtml, Validators.required)
        );
        this.contentForm.patchValue({
            selectedParagraphs: [paragraph]
        });
    }

    /**
     * Called by the template when a paragraph is clicked in multiple paragraph mode.
     * Behaves like a checkbox
     *
     * @param {ParagraphToChoose} paragraph
     */
    public toggleParagraph(paragraph: ParagraphToChoose): void {
        let newParagraphs: ParagraphToChoose[];
        const oldSelected: ParagraphToChoose[] = this.contentForm.value.selectedParagraphs;
        if (this.isParagraphSelected(paragraph)) {
            newParagraphs = oldSelected.filter(para => para.paragraphNo !== paragraph.paragraphNo);
            this.contentForm.patchValue({
                selectedParagraphs: newParagraphs
            });
            this.contentForm.removeControl('text_' + paragraph.paragraphNo);
        } else {
            newParagraphs = Object.assign([], oldSelected);
            newParagraphs.push(paragraph);
            newParagraphs.sort((para1: ParagraphToChoose, para2: ParagraphToChoose): number => {
                if (para1.paragraphNo < para2.paragraphNo) {
                    return -1;
                } else if (para1.paragraphNo > para2.paragraphNo) {
                    return 1;
                } else {
                    return 0;
                }
            });

            this.contentForm.addControl(
                'text_' + paragraph.paragraphNo,
                new FormControl(paragraph.rawHtml, Validators.required)
            );
            this.contentForm.patchValue({
                selectedParagraphs: newParagraphs
            });
        }
    }

    /**
     * Called by the template when a paragraph is clicked.
     *
     * @param {ParagraphToChoose} paragraph
     */
    public onParagraphClicked(paragraph: ParagraphToChoose): void {
        if (this.multipleParagraphsAllowed) {
            this.toggleParagraph(paragraph);
        } else {
            this.setParagraph(paragraph);
        }
    }

    /**
     * Saves the amendment and navigates to detail view of this amendment
     *
     * @returns {Promise<void>}
     */
    public async saveAmendment(): Promise<void> {
        let text = '';
        const amendedParagraphs = this.paragraphs.map((paragraph: ParagraphToChoose, index: number): string => {
            if (this.contentForm.value.selectedParagraphs.find(para => para.paragraphNo === index)) {
                text = this.contentForm.value['text_' + index];
                return this.contentForm.value['text_' + index];
            } else {
                return null;
            }
        });
        const newMotionValues = {
            ...this.contentForm.value,
            title: this.translate.instant('Amendment to') + ' ' + this.motion.identifier,
            text: text, // Workaround as 'text' is required from the backend
            parent_id: this.motion.id,
            category_id: this.motion.category_id,
            tags_id: this.motion.tags_id,
            motion_block_id: this.motion.motion_block_id,
            amendment_paragraphs: amendedParagraphs
        };

        const motion = new CreateMotion();
        motion.deserialize(newMotionValues);

        const response = await this.repo.create(motion);
        this.router.navigate(['./motions/' + response.id]);
    }
}
