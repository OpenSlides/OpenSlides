import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { StorageService } from 'app/core/core-services/storage.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Tag } from 'app/shared/models/core/tag';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ViewTag } from '../../models/view-tag';

/**
 * Listview for the complete list of available Tags
 * ### Usage:
 * ```html
 * <os-tag-list></os-tag-list>
 * ```
 */
@Component({
    selector: 'os-tag-list',
    templateUrl: './tag-list.component.html',
    styleUrls: ['./tag-list.component.scss']
})
export class TagListComponent extends BaseListViewComponent<ViewTag> implements OnInit {
    @ViewChild('tagDialog', { static: true })
    private tagDialog: TemplateRef<string>;

    private dialogRef: MatDialogRef<any>;

    public tagForm: FormGroup = this.formBuilder.group({
        name: ['', [Validators.required]]
    });

    /**
     * Holds the tag that's currently being edited, or null.
     */
    public currentTag: ViewTag;

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'name',
            width: 'auto'
        },
        {
            prop: 'edit',
            width: this.singleButtonWidth
        },
        {
            prop: 'delete',
            width: this.singleButtonWidth
        }
    ];

    /**
     * Constructor.
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo the tag repository
     * @param promptService
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        storage: StorageService,
        public repo: TagRepositoryService,
        protected translate: TranslateService, // protected required for ng-translate-extract
        private promptService: PromptService,
        private dialog: MatDialog,
        private formBuilder: FormBuilder
    ) {
        super(titleService, translate, matSnackBar, storage);
    }

    /**
     * Init function.
     * Sets the title, inits the table and calls the repo.
     */
    public ngOnInit(): void {
        super.setTitle('Tags');
    }

    /**
     * sets the given tag as the current and opens the tag dialog.
     * @param tag the current tag, or null if a new tag is to be created
     */
    public openTagDialog(tag?: ViewTag): void {
        this.currentTag = tag;
        this.tagForm.reset();
        this.tagForm.get('name').setValue(this.currentTag ? this.currentTag.name : '');
        this.dialogRef = this.dialog.open(this.tagDialog, infoDialogSettings);
        this.dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.save();
            }
        });
    }

    /**
     * Submit the form and create or update a tag.
     */
    private save(): void {
        if (!this.tagForm.value || !this.tagForm.valid) {
            return;
        }
        if (this.currentTag) {
            this.repo.update(new Tag(this.tagForm.value), this.currentTag).catch(this.raiseError);
        } else {
            this.repo.create(this.tagForm.value).catch(this.raiseError);
        }
        this.tagForm.reset(); // reset here so pressing shift+enter wont save when dialog isnt open
    }

    /**
     * Deletes the given Tag after a successful confirmation.
     */
    public async onDeleteButton(tag: ViewTag): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this tag?');
        const content = tag.name;
        if (await this.promptService.open(title, content)) {
            this.repo.delete(tag).catch(this.raiseError);
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
            this.dialogRef.close();
        }
    }
}
