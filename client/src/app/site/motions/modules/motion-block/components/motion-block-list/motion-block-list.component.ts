import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { MotionBlockSortService } from 'app/site/motions/services/motion-block-sort.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';

/**
 * Table for the motion blocks
 */
@Component({
    selector: 'os-motion-block-list',
    templateUrl: './motion-block-list.component.html',
    styleUrls: ['./motion-block-list.component.scss']
})
export class MotionBlockListComponent
    extends ListViewBaseComponent<ViewMotionBlock, MotionBlock, MotionBlockRepositoryService>
    implements OnInit {
    /**
     * Holds the create form
     */
    public createBlockForm: FormGroup;

    /**
     * Flag, if the creation panel is open
     */
    public isCreatingNewBlock = false;

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
        route: ActivatedRoute,
        storage: StorageService,
        private repo: MotionBlockRepositoryService,
        private agendaRepo: ItemRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private itemRepo: ItemRepositoryService,
        private operator: OperatorService,
        sortService: MotionBlockSortService
    ) {
        super(titleService, translate, matSnackBar, repo, route, storage, null, sortService);

        this.createBlockForm = this.formBuilder.group({
            title: ['', Validators.required],
            agenda_type: ['', Validators.required],
            agenda_parent_id: [],
            internal: [false]
        });
    }

    /**
     * Observe the agendaItems for changes.
     */
    public ngOnInit(): void {
        super.setTitle('Motion blocks');
        this.initTable();
        this.items = this.itemRepo.getViewModelListBehaviorSubject();
        this.agendaRepo.getDefaultAgendaVisibility().subscribe(visibility => (this.defaultVisibility = visibility));
    }

    /**
     * Returns the columns that should be shown in the table
     *
     * @returns an array of strings building the column definition
     */
    public getColumnDefinition(): string[] {
        let columns = ['title', 'amount', 'anchor'];
        if (this.operator.hasPerms('core.can_manage_projector')) {
            columns = ['projector'].concat(columns);
        }
        if (this.operator.hasPerms('motions.can_manage')) {
            columns = columns.concat(['menu']);
        }
        return columns;
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
        const title = this.translate.instant('Are you sure you want to delete this motion block?');
        const content = motionBlock.title;
        if (await this.promptService.open(title, content)) {
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
        if (!this.isCreatingNewBlock) {
            this.resetForm();
            this.isCreatingNewBlock = true;
        }
    }

    /**
     * Click handler for the save button.
     * Sends the block to create to the repository and resets the form.
     */
    public onSaveNewButton(): void {
        if (this.createBlockForm.valid) {
            const block = this.createBlockForm.value;
            if (!block.agenda_parent_id) {
                delete block.agenda_parent_id;
            }

            try {
                this.repo.create(block);
                this.resetForm();
                this.isCreatingNewBlock = false;
            } catch (e) {
                this.raiseError(e);
            }
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
        this.isCreatingNewBlock = false;
    }
}
