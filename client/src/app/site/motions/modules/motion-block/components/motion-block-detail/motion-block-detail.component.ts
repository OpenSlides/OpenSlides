import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition, PblDataSource, createDS, columnFactory } from '@pebula/ngrid';

import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { BaseViewComponent } from 'app/site/base/base-view';

/**
 * Detail component to display one motion block
 */
@Component({
    selector: 'os-motion-block-detail',
    templateUrl: './motion-block-detail.component.html',
    styleUrls: ['./motion-block-detail.component.scss']
})
export class MotionBlockDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * Determines the block id from the given URL
     */
    public block: ViewMotionBlock;

    /**
     * Data source for the motions in the block
     */
    public dataSource: PblDataSource<ViewMotion>;

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [];

    /**
     * Define the columns to show
     * TODO: The translation will not update when the
     */
    public columnSet = columnFactory()
        .table(
            {
                prop: 'title',
                label: this.translate.instant('Title'),
                width: 'auto'
            },
            {
                prop: 'state',
                label: this.translate.instant('State'),
                width: '30%',
                minWidth: 60
            },
            {
                prop: 'recommendation',
                label: this.translate.instant('Recommendation'),
                width: '30%',
                minWidth: 60
            },
            {
                prop: 'remove',
                label: '',
                width: '40px'
            }
        )
        .build();

    /**
     * The form to edit blocks
     */
    @ViewChild('blockEditForm')
    public blockEditForm: FormGroup;

    /**
     * Reference to the template for edit-dialog
     */
    @ViewChild('editDialog')
    private editDialog: TemplateRef<string>;

    /**
     * Constructor for motion block details
     *
     * @param titleService Setting the title
     * @param translate translations
     * @param matSnackBar showing errors
     * @param operator the current user
     * @param router navigating
     * @param route determine the blocks ID by the route
     * @param repo the motion blocks repository
     * @param motionRepo the motion repository
     * @param promptService the displaying prompts before deleting
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        protected repo: MotionBlockRepositoryService,
        protected motionRepo: MotionRepositoryService,
        private promptService: PromptService,
        private fb: FormBuilder,
        private dialog: MatDialog
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function.
     * Sets the title, observes the block and the motions belonging in this block
     */
    public ngOnInit(): void {
        super.setTitle('Motion block');

        const blockId = parseInt(this.route.snapshot.params.id, 10);

        // pseudo filter
        this.subscriptions.push(
            this.repo.getViewModelObservable(blockId).subscribe(newBlock => {
                if (newBlock) {
                    super.setTitle(newBlock.getTitle());
                    this.block = newBlock;

                    this.dataSource = createDS<ViewMotion>()
                        .onTrigger(() => {
                            return this.repo.getViewMotionsByBlock(this.block.motionBlock);
                        })
                        .create();
                }
            })
        );
    }

    /**
     * Click handler for recommendation button
     */
    public async onFollowRecButton(): Promise<void> {
        const title = this.translate.instant(
            'Are you sure you want to override the state of all motions of this motion block?'
        );
        const content = this.block.title;
        if (await this.promptService.open(title, content)) {
            this.repo.followRecommendation(this.block);
        }
    }

    /**
     * Click handler to delete motion blocks
     */
    public async onDeleteBlockButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this motion block?');
        const content = this.block.title;
        if (await this.promptService.open(title, content)) {
            await this.repo.delete(this.block);
            this.router.navigate(['../'], { relativeTo: this.route });
        }
    }

    /**
     * Click handler for the delete button on the table
     *
     * @param motion the corresponding motion
     */
    public async onRemoveMotionButton(motion: ViewMotion): Promise<void> {
        const title = this.translate.instant('Are you sure you want to remove this motion from motion block?');
        const content = motion.getTitle();
        if (await this.promptService.open(title, content)) {
            this.repo.removeMotionFromBlock(motion);
        }
    }

    /**
     * Clicking escape while in editForm should deactivate edit mode.
     *
     * @param event The key that was pressed
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.dialog.closeAll();
        }
    }

    /**
     * Determine if following the recommendations should be possible.
     * Following a recommendation implies, that a valid recommendation exists.
     */
    public isFollowingProhibited(): boolean {
        if (this.dataSource && this.dataSource.source) {
            return this.dataSource.source.every(motion => motion.isInFinalState() || !motion.recommendation_id);
        } else {
            return false;
        }
    }

    /**
     * Save event handler
     */
    public saveBlock(): void {
        this.repo
            .update(this.blockEditForm.value as MotionBlock, this.block)
            .then(() => this.dialog.closeAll())
            .catch(this.raiseError);
    }

    /**
     * Click handler for the edit button
     */
    public toggleEditMode(): void {
        this.blockEditForm = this.fb.group({
            title: [this.block.title, Validators.required],
            internal: [this.block.internal]
        });

        const dialogRef = this.dialog.open(this.editDialog, {
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            disableClose: true
        });

        dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
            if (event.key === 'Enter' && event.shiftKey) {
                this.saveBlock();
            }
        });
    }

    /**
     * Fetch a motion's current recommendation label
     *
     * @param motion
     * @returns the current recommendation label (with extension)
     */
    public getRecommendationLabel(motion: ViewMotion): string {
        return this.motionRepo.getExtendedRecommendationLabel(motion);
    }

    /**
     * Fetch a motion's current state label
     *
     * @param motion
     * @returns the current state label (with extension)
     */
    public getStateLabel(motion: ViewMotion): string {
        return this.motionRepo.getExtendedStateLabel(motion);
    }
}
