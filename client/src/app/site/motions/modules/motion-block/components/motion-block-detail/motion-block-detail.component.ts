import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { StorageService } from 'app/core/core-services/storage.service';
import { Motion } from 'app/shared/models/motions/motion';

/**
 * Detail component to display one motion block
 */
@Component({
    selector: 'os-motion-block-detail',
    templateUrl: './motion-block-detail.component.html',
    styleUrls: ['./motion-block-detail.component.scss']
})
export class MotionBlockDetailComponent extends ListViewBaseComponent<ViewMotion, Motion, MotionRepositoryService>
    implements OnInit {
    /**
     * Determines the block id from the given URL
     */
    public block: ViewMotionBlock;

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
        route: ActivatedRoute,
        storage: StorageService,
        private operator: OperatorService,
        private router: Router,
        protected repo: MotionBlockRepositoryService,
        protected motionRepo: MotionRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar, motionRepo, route, storage);
    }

    /**
     * Init function.
     * Sets the title, observes the block and the motions belonging in this block
     */
    public ngOnInit(): void {
        super.setTitle('Motion block');
        this.initTable();
        const blockId = parseInt(this.route.snapshot.params.id, 10);

        this.blockEditForm = new FormGroup({
            title: new FormControl('', Validators.required)
        });

        // pseudo filter
        this.subscriptions.push(
            this.repo.getViewModelObservable(blockId).subscribe(newBlock => {
                if (newBlock) {
                    this.block = newBlock;
                    this.subscriptions.push(
                        this.repo.getViewMotionsByBlock(this.block.motionBlock).subscribe(viewMotions => {
                            if (viewMotions && viewMotions.length) {
                                this.dataSource.data = viewMotions;
                            } else {
                                this.dataSource.data = [];
                            }
                        })
                    );
                }
            })
        );
    }

    /**
     * Returns the columns that should be shown in the table
     *
     * @returns an array of strings building the column definition
     */
    public getColumnDefinition(): string[] {
        let columns = ['title', 'state', 'recommendation', 'anchor'];
        if (this.operator.hasPerms('motions.can_manage_manage')) {
            columns = columns.concat('remove');
        }
        return columns;
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
     * Return the URL to a selected motion
     *
     * @param motion the selected ViewMotion
     * @returns a link as url
     */
    public getMotionLink(motion: ViewMotion): string {
        return `/motions/${motion.id}`;
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
            this.editBlock = false;
        }
    }

    /**
     * Determine if following the recommendations should be possible.
     * Following a recommendation implies, that a valid recommendation exists.
     */
    public isFollowingProhibited(): boolean {
        if (this.dataSource.data) {
            return this.dataSource.data.every(motion => motion.isInFinalState() || !motion.recommendation_id);
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
