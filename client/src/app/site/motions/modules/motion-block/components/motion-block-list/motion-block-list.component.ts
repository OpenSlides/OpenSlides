import { Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';
import { BehaviorSubject } from 'rxjs';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { MotionBlockSortService } from 'app/site/motions/services/motion-block-sort.service';

/**
 * Table for the motion blocks
 */
@Component({
    selector: 'os-motion-block-list',
    templateUrl: './motion-block-list.component.html',
    styleUrls: ['./motion-block-list.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MotionBlockListComponent extends BaseListViewComponent<ViewMotionBlock> implements OnInit {
    @ViewChild('newMotionBlockDialog', { static: true })
    private newMotionBlockDialog: TemplateRef<string>;

    private dialogRef: MatDialogRef<any>;

    /**
     * Holds the create form
     */
    public createBlockForm: FormGroup;

    /**
     * Holds the agenda items to select the parent item
     */
    public items: BehaviorSubject<ViewItem[]>;

    /**
     * Determine the default agenda visibility
     */
    public defaultVisibility: number;

    /**
     * Defines the properties the `sort-filter-bar` can search for.
     */
    public filterProps = ['title'];

    /**
     * helper for permission checks
     *
     * @returns true if the user may alter motions or their metadata
     */
    public get canEdit(): boolean {
        return this.operator.hasPerms(Permission.motionsCanManage, Permission.motionsCanManageMetadata);
    }

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            label: this.translate.instant('Title'),
            width: 'auto'
        },
        {
            prop: 'amount',
            label: this.translate.instant('Motions'),
            width: '40px'
        }
    ];

    /**
     * Constructor for the motion block list view
     *
     * @param titleService sets the title
     * @param translate translpations
     * @param matSnackBar display errors in the snack bar
     * @param route determine the local route
     * @param storage
     * @param repo the motion block repository
     * @param formBuilder creates forms
     * @param promptService the delete prompt
     * @param itemRepo
     * @param operator permission checks
     * @param sortService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        storage: StorageService,
        public repo: MotionBlockRepositoryService,
        private formBuilder: FormBuilder,
        private itemRepo: ItemRepositoryService,
        private operator: OperatorService,
        private dialog: MatDialog,
        public sortService: MotionBlockSortService
    ) {
        super(titleService, translate, matSnackBar, storage);

        this.createBlockForm = this.formBuilder.group({
            title: ['', Validators.required],
            agenda_create: [''],
            agenda_parent_id: [],
            agenda_type: [''],
            internal: [false]
        });
    }

    /**
     * Observe the agendaItems for changes.
     */
    public ngOnInit(): void {
        super.setTitle('Motion blocks');
        this.items = this.itemRepo.getViewModelListBehaviorSubject();
    }

    /**
     * Helper function reset the form and set the default values
     */
    private resetForm(): void {
        this.createBlockForm.reset();
        this.createBlockForm.get('agenda_type').setValue(this.defaultVisibility);
    }

    /**
     * Click handler for the plus button.
     * Opens the dialog for motion block creation.
     */
    public onPlusButton(): void {
        this.resetForm();
        this.dialogRef = this.dialog.open(this.newMotionBlockDialog, infoDialogSettings);
        this.dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.save();
            }
        });
    }

    /**
     * Sends the block to create to the repository and resets the form.
     */
    private save(): void {
        if (this.createBlockForm.valid) {
            const block = this.createBlockForm.value;
            if (!block.agenda_parent_id) {
                delete block.agenda_parent_id;
            }
            this.repo.create(block).catch(this.raiseError);
            this.resetForm();
        }
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.save();
            this.dialogRef.close();
        }
        if (event.key === 'Escape') {
            this.resetForm();
            this.dialogRef.close();
        }
    }
}
