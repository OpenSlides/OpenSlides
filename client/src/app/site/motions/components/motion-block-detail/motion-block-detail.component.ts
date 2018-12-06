import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { MotionBlockRepositoryService } from '../../services/motion-block-repository.service';
import { MotionRepositoryService } from '../../services/motion-repository.service';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { ViewMotionBlock } from '../../models/view-motion-block';
import { ViewMotion } from '../../models/view-motion';
import { PromptService } from 'app/core/services/prompt.service';

/**
 * Detail component to display one motion block
 */
@Component({
    selector: 'os-motion-block-detail',
    templateUrl: './motion-block-detail.component.html',
    styleUrls: ['./motion-block-detail.component.scss']
})
export class MotionBlockDetailComponent extends ListViewBaseComponent<ViewMotion> implements OnInit {
    /**
     * Determines the block id from the given URL
     */
    public block: ViewMotionBlock;

    /**
     * All motions in this block
     */
    public motions: ViewMotion[];

    /**
     * Determine the edit mode
     */
    public editBlock = false;

    /**
     * The form to edit blocks
     */
    @ViewChild('blockEditForm')
    public blockEditForm: FormGroup;

    /**
     * Constructor for motion block details
     *
     * @param titleService Setting the title
     * @param translate translations
     * @param matSnackBar showing errors
     * @param router navigating
     * @param route determine the blocks ID by the route
     * @param repo the motion blocks repository
     * @param motionRepo the motion repository
     * @param promptService the displaying prompts before deleting
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private repo: MotionBlockRepositoryService,
        private motionRepo: MotionRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function.
     * Sets the title, observes the block and the motions belonging in this block
     */
    public ngOnInit(): void {
        super.setTitle('Motion Block');
        this.initTable();

        this.blockEditForm = new FormGroup({
            title: new FormControl('', Validators.required)
        });

        const blockId = +this.route.snapshot.params.id;
        this.block = this.repo.getViewModel(blockId);

        this.repo.getViewModelObservable(blockId).subscribe(newBlock => {
            // necessary since the subscription can return undefined
            if (newBlock) {
                this.block = newBlock;

                // set the blocks title in the form
                this.blockEditForm.get('title').setValue(this.block.title);

                this.repo.getViewMotionsByBlock(this.block.motionBlock).subscribe(newMotions => {
                    this.motions = newMotions;
                    this.dataSource.data = this.motions;
                });
            }
        });
    }

    /**
     * Get link to the list of speakers of the corresponding agenda item
     *
     * @returns the link to the list of speakers as string
     */
    public getSpeakerLink(): string {
        if (this.block) {
            return `/agenda/${this.block.agenda_item_id}/speakers`;
        }
    }

    /**
     * Returns the columns that should be shown in the table
     *
     * @returns an array of strings building the column definition
     */
    public getColumnDefinition(): string[] {
        return ['title', 'state', 'recommendation', 'remove'];
    }

    /**
     * Click handler for recommendation button
     */
    public async onFollowRecButton(): Promise<void> {
        const content = this.translate.instant(
            `Are you sure you want to override the state of all motions of this motion block?`
        );
        if (await this.promptService.open(this.block.title, content)) {
            for (const motion of this.motions) {
                if (!motion.isInFinalState()) {
                    this.motionRepo.setState(motion, motion.recommendation_id);
                }
            }
        }
    }

    /**
     * Click handler for the motion title cell in the table
     * Navigate to the motion that was clicked on
     *
     * @param motion the selected ViewMotion
     */
    public onClickMotionTitle(motion: ViewMotion): void {
        this.router.navigate([`/motions/${motion.id}`]);
    }

    /**
     * Click handler to delete motion blocks
     */
    public async onDeleteBlockButton(): Promise<void> {
        const content = this.translate.instant('Are you sure you want to delete this motion block?');
        if (await this.promptService.open(this.block.title, content)) {
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
        const content = this.translate.instant('Are you sure you want to remove this motion from motion block?');
        if (await this.promptService.open(motion.title, content)) {
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
            this.editBlock = false;
        }
    }

    /**
     * Determine if following the recommendations should be possible.
     * Following a recommendation implies, that a valid recommendation exists.
     */
    public isFollowingProhibited(): boolean {
        if (this.motions) {
            return this.motions.every(motion => motion.isInFinalState() || !motion.recommendation_id);
        } else {
            return false;
        }
    }

    /**
     * Save event handler
     */
    public saveBlock(): void {
        this.editBlock = false;
        this.repo.update(this.blockEditForm.value as MotionBlock, this.block);
    }

    /**
     * Click handler for the edit button
     */
    public toggleEditMode(): void {
        this.editBlock = !this.editBlock;
    }
}
