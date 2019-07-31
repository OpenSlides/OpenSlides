import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Tag } from 'app/shared/models/core/tag';
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

    private tagForm: FormGroup = this.formBuilder.group({
        name: ['', [Validators.required]]
    });

    private dialogRef: MatDialogRef<string, any>;

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
        public repo: TagRepositoryService,
        protected translate: TranslateService, // protected required for ng-translate-extract
        private promptService: PromptService,
        private dialog: MatDialog,
        private formBuilder: FormBuilder
    ) {
        super(titleService, translate, matSnackBar);
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
        this.dialogRef = this.dialog.open(this.tagDialog, {
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            disableClose: true
        });
    }

    /**
     * Submit the form and create or update a tag.
     */
    public onSubmit(): void {
        if (!this.tagForm.value || !this.tagForm.valid) {
            return;
        }
        if (this.currentTag) {
            this.repo
                .update(new Tag(this.tagForm.value), this.currentTag)
                .then(() => this.dialogRef.close(), this.raiseError);
        } else {
            this.repo.create(this.tagForm.value).then(() => this.dialogRef.close(), this.raiseError);
        }
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
}
