import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { itemVisibilityChoices } from 'app/shared/models/agenda/item';
import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewMotionBlock } from '../../models/view-motion-block';

/**
 * Table for the motion blocks
 */
@Component({
    selector: 'os-motion-block-list',
    templateUrl: './motion-block-list.component.html',
    styleUrls: ['./motion-block-list.component.scss']
})
export class MotionBlockListComponent extends ListViewBaseComponent<ViewMotionBlock> implements OnInit {
    /**
     * Holds the create form
     */
    public createBlockForm: FormGroup;

    /**
     * The new motion block to create
     */
    public blockToCreate: MotionBlock | null;

    /**
     * Holds the agenda items to select the parent item
     */
    public items: BehaviorSubject<ViewItem[]>;

    /**
     * Determine the default agenda visibility
     */
    public defaultVisibility: number;

    /**
     * Determine visibility states for the agenda that will be created implicitly
     */
    public itemVisibility = itemVisibilityChoices;

    /**
     * helper for permission checks
     *
     * @returns true if the user may alter motions or their metadata
     */
    public get canEdit(): boolean {
        return this.operator.hasPerms('motions.can_manage', 'motions.can_manage_metadata');
    }

    /**
     * Constructor for the motion block list view
     *
     * @param titleService sets the title
     * @param translate translpations
     * @param matSnackBar display errors in the snack bar
     * @param router routing to children
     * @param route determine the local route
     * @param repo the motion block repository
     * @param agendaRepo the agenda repository service
     * @param DS the dataStore
     * @param formBuilder creates forms
     * @param promptService the delete prompt
     * @param itemRepo
     * @param operator permission checks
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private repo: MotionBlockRepositoryService,
        private agendaRepo: ItemRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private itemRepo: ItemRepositoryService,
        private operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar);

        this.createBlockForm = this.formBuilder.group({
            title: ['', Validators.required],
            agenda_type: ['', Validators.required],
            agenda_parent_id: []
        });
    }

    /**
     * Observe the agendaItems for changes.
     */
    public ngOnInit(): void {
        super.setTitle('Motion Blocks');
        this.initTable();

        this.items = new BehaviorSubject(this.itemRepo.getViewModelList());
        this.itemRepo.getViewModelListObservable().subscribe(items => this.items.next(items));

        this.repo.getViewModelListObservable().subscribe(newMotionblocks => {
            newMotionblocks.sort((a, b) => (a > b ? 1 : -1));
            this.dataSource.data = newMotionblocks;
        });

        this.agendaRepo.getDefaultAgendaVisibility().subscribe(visibility => (this.defaultVisibility = visibility));
    }

    /**
     * Returns the columns that should be shown in the table
     *
     * @returns an array of strings building the column definition
     */
    public getColumnDefinition(): string[] {
        return ['title', 'amount', 'menu'];
    }

    /**
     * Action while clicking on a row. Navigate to the detail page of given block
     *
     * @param block the given motion block
     */
    public openItem(block: ViewMotionBlock): void {
        this.router.navigate([`${block.id}`], { relativeTo: this.route });
    }

    /**
     * return the amount of motions in a motion block
     *
     * @param motionBlock the block to determine the amount of motions for
     * @returns a number that indicates how many motions are in the given block
     */
    public getMotionAmount(motionBlock: MotionBlock): number {
        return this.repo.getMotionAmountByBlock(motionBlock);
    }

    /**
     * Click handler to delete motion blocks
     *
     * @param motionBlock the block to delete
     */
    public async onDelete(motionBlock: ViewMotionBlock): Promise<void> {
        const content = this.translate.instant('Are you sure you want to delete this motion block?');
        if (await this.promptService.open(motionBlock.title, content)) {
            await this.repo.delete(motionBlock);
        }
    }

    /**
     * Helper function reset the form and set the default values
     */
    public resetForm(): void {
        this.createBlockForm.reset();
        this.createBlockForm.get('agenda_type').setValue(this.defaultVisibility);
    }

    /**
     * Click handler for the plus button
     */
    public onPlusButton(): void {
        if (!this.blockToCreate) {
            this.resetForm();
            this.blockToCreate = new MotionBlock();
        }
    }

    /**
     * Click handler for the save button.
     * Sends the block to create to the repository and resets the form.
     */
    public onSaveNewButton(): void {
        if (this.createBlockForm.valid) {
            const blockPatch = this.createBlockForm.value;
            if (!blockPatch.agenda_parent_id) {
                delete blockPatch.agenda_parent_id;
            }

            this.blockToCreate.patchValues(blockPatch);
            this.repo.create(this.blockToCreate);
            this.resetForm();
            this.blockToCreate = null;
        }
        // set a form control as "touched" to trigger potential error messages
        this.createBlockForm.get('title').markAsTouched();
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.onSaveNewButton();
        }
        if (event.key === 'Escape') {
            this.onCancel();
        }
    }

    /**
     * Cancels the current form action
     */
    public onCancel(): void {
        this.blockToCreate = null;
    }
}
