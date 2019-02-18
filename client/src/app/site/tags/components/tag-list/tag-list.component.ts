import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { Tag } from 'app/shared/models/core/tag';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { ViewTag } from '../../models/view-tag';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { MatSnackBar } from '@angular/material';

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
    styleUrls: ['./tag-list.component.css']
})
export class TagListComponent extends ListViewBaseComponent<ViewTag, Tag> implements OnInit {
    public editTag = false;
    public newTag = false;
    public selectedTag: ViewTag;

    @ViewChild('tagForm')
    public tagForm: FormGroup;

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
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: TagRepositoryService,
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
        this.initTable();
        this.tagForm = new FormGroup({ name: new FormControl('', Validators.required) });
        // TODO Tag has not yet sort or filtering functions
        this.repo.getViewModelListObservable().subscribe(newTags => {
            this.dataSource.data = [];
            this.dataSource.data = newTags;
        });
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
        const content = this.translate.instant('Delete') + ` ${this.selectedTag.name}?`;
        if (await this.promptService.open(this.translate.instant('Are you sure?'), content)) {
            this.repo.delete(this.selectedTag).then(() => this.cancelEditing(), this.raiseError);
        }
    }

    /**
     * Canceles the editing
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
    public singleSelectAction(viewTag: ViewTag): void {
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
