import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';
import { BehaviorSubject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { Item, itemVisibilityChoices } from 'app/shared/models/agenda/item';
import { DataStoreService } from 'app/core/services/data-store.service';
import { MotionBlockRepositoryService } from '../../services/motion-block-repository.service';
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
    public items: BehaviorSubject<Item[]>;

    /**
     * Determine the default agenda visibility
     */
    public defaultVisibility: number;

    /**
     * Determine visibility states for the agenda that will be created implicitly
     */
    public itemVisibility = itemVisibilityChoices;

    /**
     * Constructor for the motion block list view
     *
     * @param titleService sets the title
     * @param translate translations
     * @param matSnackBar display errors in the snack bar
     * @param router routing to children
     * @param route determine the local route
     * @param repo the motion block repository
     * @param DS the dataStore
     * @param formBuilder creates forms
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private repo: MotionBlockRepositoryService,
        private DS: DataStoreService,
        private formBuilder: FormBuilder
    ) {
        super(titleService, translate, matSnackBar);

        this.createBlockForm = this.formBuilder.group({
            title: ['', Validators.required],
            agenda_type: ['', Validators.required],
            agenda_parent_id: ['']
        });
    }

    /**
     * Observe the agendaItems for changes.
     */
    public ngOnInit(): void {
        super.setTitle('Motion Blocks');
        this.initTable();

        this.items = new BehaviorSubject(this.DS.getAll(Item));

        this.DS.changeObservable.subscribe(model => {
            if (model instanceof Item) {
                this.items.next(this.DS.getAll(Item));
            }
        });

        this.repo.getViewModelListObservable().subscribe(newMotionblocks => {
            this.dataSource.data = newMotionblocks;
        });

        this.repo.getDefaultAgendaVisibility().subscribe(visibility => (this.defaultVisibility = visibility));
    }

    /**
     * Returns the columns that should be shown in the table
     *
     * @returns an array of strings building the column definition
     */
    public getColumnDefinition(): string[] {
        return ['title', 'amount'];
    }

    /**
     * Action while clicking on a row. Navigate to the detail page of given block
     *
     * @param block the given motion block
     */
    public onSelectRow(block: ViewMotionBlock): void {
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
}
