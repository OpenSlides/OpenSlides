import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { Permission } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { ColumnRestriction } from 'app/shared/components/list-view-table/list-view-table.component';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { BlockDetailFilterListService } from 'app/site/motions/services/block-detail-filter-list.service';

/**
 * Detail component to display one motion block
 */
@Component({
    selector: 'os-motion-block-detail',
    templateUrl: './motion-block-detail.component.html',
    styleUrls: ['./motion-block-detail.component.scss']
})
export class MotionBlockDetailComponent extends BaseListViewComponent<ViewMotion> implements OnInit {
    /**
     * Holds the block ID
     */
    private blockId: number;

    /**
     * Determines the block id from the given URL
     */
    public block: ViewMotionBlock;

    /**
     * To quick-filter the list
     */
    public filterProps = ['submitters', 'title', 'identifier'];

    /**
     * Columns to display in table when desktop view is available
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            width: 'auto'
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
    ];
    /**
     * Restrictions for specific columns
     */
    public restrictedColumns: ColumnRestriction[] = [
        {
            columnName: 'remove',
            permission: Permission.motionsCanManage
        }
    ];

    /**
     * Value of the config variable `motions_show_sequential_numbers`
     */
    public showSequential: boolean;

    /**
     * The form to edit blocks
     */
    @ViewChild('blockEditForm', { static: true })
    public blockEditForm: FormGroup;

    /**
     * Reference to the template for edit-dialog
     */
    @ViewChild('editDialog', { static: true })
    private editDialog: TemplateRef<string>;

    private dialogRef: MatDialogRef<any>;

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
        private configService: ConfigService,
        private route: ActivatedRoute,
        private router: Router,
        protected repo: MotionBlockRepositoryService,
        public motionRepo: MotionRepositoryService,
        private promptService: PromptService,
        private fb: FormBuilder,
        private dialog: MatDialog,
        private itemRepo: ItemRepositoryService,
        storage: StorageService,
        public filterService: BlockDetailFilterListService,
        public vp: ViewportService
    ) {
        super(titleService, translate, matSnackBar, storage);
        this.blockId = parseInt(this.route.snapshot.params.id, 10);
        this.filterService.blockId = this.blockId;
    }

    /**
     * Init function.
     * Sets the title, observes the block and the motions belonging in this block
     */
    public ngOnInit(): void {
        // pseudo filter
        this.subscriptions.push(
            this.repo.getViewModelObservable(this.blockId).subscribe(newBlock => {
                if (newBlock) {
                    super.setTitle(`${this.translate.instant('Motion block')} - ${newBlock.getTitle()}`);
                    this.block = newBlock;
                }
            })
        );
        // load config variables
        this.configService
            .get<boolean>('motions_show_sequential_numbers')
            .subscribe(show => (this.showSequential = show));
        (<any>window).comp = this;
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
            this.dialogRef.close();
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
            .then(() => this.dialogRef.close())
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

        this.dialogRef = this.dialog.open(this.editDialog, infoDialogSettings);

        this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
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

    public addToAgenda(): void {
        this.itemRepo.addItemToAgenda(this.block).catch(this.raiseError);
    }

    public removeFromAgenda(): void {
        this.itemRepo.removeFromAgenda(this.block.item).catch(this.raiseError);
    }
}
