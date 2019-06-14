import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { ListViewBaseComponent } from '../../../base/list-view-base';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Tag } from 'app/shared/models/core/tag';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { ViewTag } from '../../models/view-tag';

/**
 * Listview for the complete lsit of available Tags
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
export class TagListComponent extends ListViewBaseComponent<ViewTag> implements OnInit {
    public editTag = false;
    public newTag = false;
    public selectedTag: ViewTag;

    @ViewChild('tagForm')
    public tagForm: FormGroup;

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'name',
            width: 'auto'
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
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function.
     * Sets the title, inits the table and calls the repo.
     */
    public ngOnInit(): void {
        super.setTitle('Tags');
        this.tagForm = new FormGroup({ name: new FormControl('', Validators.required) });
    }

    /**
     * Sends a new or updates tag to the dataStore
     */
    public saveTag(): void {
        if (this.editTag && this.newTag) {
            this.submitNewTag();
        } else if (this.editTag && !this.newTag) {
            this.submitEditedTag();
        }
    }

    /**
     * Saves a newly created tag.
     */
    public submitNewTag(): void {
        if (!this.tagForm.value || !this.tagForm.valid) {
            return;
        }
        this.repo.create(this.tagForm.value).then(() => {
            this.tagForm.reset();
            this.cancelEditing();
        }, this.raiseError);
    }

    /**
     * Saves an edited tag.
     */
    public submitEditedTag(): void {
        if (!this.tagForm.value || !this.tagForm.valid) {
            return;
        }
        const updateData = new Tag({ name: this.tagForm.value.name });

        this.repo.update(updateData, this.selectedTag).then(() => this.cancelEditing(), this.raiseError);
    }

    /**
     * Deletes the selected Tag after a successful confirmation.
     */
    public async deleteSelectedTag(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this tag?');
        const content = this.selectedTag.name;
        if (await this.promptService.open(title, content)) {
            this.repo.delete(this.selectedTag).then(() => this.cancelEditing(), this.raiseError);
        }
    }

    /**
     * Cancels the editing
     */
    public cancelEditing(): void {
        this.newTag = false;
        this.editTag = false;
        this.tagForm.reset();
    }

    /**
     * Handler for a click on a row in the table
     * @param viewTag
     */
    public selectTag(viewTag: ViewTag): void {
        this.selectedTag = viewTag;
        this.setEditMode(true, false);
        this.tagForm.setValue({ name: this.selectedTag.name });
    }

    public setEditMode(mode: boolean, newTag: boolean = true): void {
        this.editTag = mode;
        this.newTag = newTag;
        if (!mode) {
            this.cancelEditing();
        }
    }

    /**
     * Handles keyboard events. On enter, the editing is canceled.
     * @param event
     */
    public keyDownFunction(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.submitNewTag();
        }
        if (event.key === 'Escape') {
            this.cancelEditing();
        }
    }
}
