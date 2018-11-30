import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { MotionRepositoryService } from '../../services/motion-repository.service';
import { ViewMotion } from '../../models/view-motion';
import { LinenumberingService } from '../../services/linenumbering.service';
import { BaseViewComponent } from '../../../base/base-view';
import { CreateMotion } from '../../models/create-motion';

/**
 * Describes the single paragraphs from the base motion.
 */
interface ParagraphToChoose {
    /**
     * The paragraph number.
     */
    paragraphNo: number;

    /**
     * The raw HTML of this paragraph.
     */
    rawHtml: string;

    /**
     * The HTML of this paragraph, wrapped in a `SafeHtml`-object.
     */
    safeHtml: SafeHtml;
}

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
     * Motions meta-info
     */
    public metaInfoForm: FormGroup;

    /**
     * Constructs this component.
     *
     * @param {Title} titleService set the browser title
     * @param {TranslateService} translate the translation service
     * @param {FormBuilder} formBuilder Form builder
     * @param {MotionRepositoryService} repo Motion Repository
     * @param {ActivatedRoute} route The activated route
     * @param {Router} router The router
     * @param {DomSanitizer} sanitizer The DOM Sanitizing library
     * @param {LinenumberingService} lineNumbering The line numbering service
     * @param {MatSnackBar} matSnackBar Material Design SnackBar
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        private formBuilder: FormBuilder,
        private repo: MotionRepositoryService,
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer,
        private lineNumbering: LinenumberingService,
        matSnackBar: MatSnackBar
    ) {
        super(titleService, translate, matSnackBar);
        this.getMotionByUrl();
        this.createForm();
    }

    /**
     * determine the motion to display using the URL
     */
    public getMotionByUrl(): void {
        // load existing motion
        this.route.params.subscribe(params => {
            this.repo.getViewModelObservable(params.id).subscribe(newViewMotion => {
                this.motion = newViewMotion;

                this.paragraphs = this.repo
                    .getTextParagraphs(this.motion, true)
                    .map((paragraph: string, index: number) => {
                        return {
                            paragraphNo: index,
                            safeHtml: this.sanitizer.bypassSecurityTrustHtml(paragraph),
                            rawHtml: this.lineNumbering.stripLineNumbers(paragraph)
                        };
                    });
            });
        });
    }

    /**
     * Creates the forms for the Motion and the MotionVersion
     */
    public createForm(): void {
        this.contentForm = this.formBuilder.group({
            selectedParagraph: [null, Validators.required],
            text: ['', Validators.required],
            reason: ['', Validators.required]
        });
        this.metaInfoForm = this.formBuilder.group({
            identifier: [''],
            category_id: [''],
            state_id: [''],
            recommendation_id: [''],
            submitters_id: [],
            supporters_id: [],
            origin: ['']
        });
    }

    /**
     * Called by the template when a paragraph is clicked.
     *
     * @param {ParagraphToChoose} paragraph
     */
    public selectParagraph(paragraph: ParagraphToChoose): void {
        this.contentForm.patchValue({
            selectedParagraph: paragraph.paragraphNo,
            text: paragraph.rawHtml
        });
    }

    /**
     * Saves the amendment and navigates to detail view of this amendment
     *
     * @returns {Promise<void>}
     */
    public async saveAmendment(): Promise<void> {
        const amendedParagraphs = this.paragraphs.map(
            (paragraph: ParagraphToChoose, index: number): string => {
                if (index === this.contentForm.value.selectedParagraph) {
                    return this.contentForm.value.text;
                } else {
                    return null;
                }
            }
        );
        const newMotionValues = {
            ...this.metaInfoForm.value,
            ...this.contentForm.value,
            title: this.translate.instant('Amendment to') + ' ' + this.motion.identifier,
            parent_id: this.motion.id,
            amendment_paragraphs: amendedParagraphs
        };

        const motion = new CreateMotion();
        motion.deserialize(newMotionValues);

        const response = await this.repo.create(motion);
        this.router.navigate(['./motions/' + response.id]);
    }
}
