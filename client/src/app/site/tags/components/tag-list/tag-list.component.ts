import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { Tag } from '../../../../shared/models/core/tag';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { TagRepositoryService } from '../../services/tag-repository.service';
import { ViewTag } from '../../models/view-tag';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PromptService } from '../../../../core/services/prompt.service';

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
export class TagListComponent extends ListViewBaseComponent<ViewTag> implements OnInit {
    public editTag = false;
    public newTag = false;
    public selectedTag: ViewTag;

    @ViewChild('tagForm')
    public tagForm: FormGroup;

    /**
     * Constructor.
     * @param titleService
     * @param translate
     * @param repo the repository
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        private repo: TagRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate);
    }

    /**
     * Init function.
     * Sets the title, inits the table and calls the repo.
     */
    public ngOnInit(): void {
        super.setTitle('Tags');
        this.initTable();
        this.tagForm = new FormGroup({ name: new FormControl('', Validators.required) });
        this.repo.getViewModelListObservable().subscribe(newTags => {
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
    public async submitNewTag(): Promise<void> {
        if (!this.tagForm.value || !this.tagForm.valid) {
            return;
        }
        await this.repo.create(this.tagForm.value);
        this.tagForm.reset();
        this.cancelEditing();
    }

    /**
     * Saves an edited tag.
     */
    public async submitEditedTag(): Promise<void> {
        if (!this.tagForm.value || !this.tagForm.valid) {
            return;
        }
        const updateData = new Tag({ name: this.tagForm.value.name });

        await this.repo.update(updateData, this.selectedTag);
        this.cancelEditing();
    }

    /**
     * Deletes the selected Tag after a successful confirmation.
     */
    public async deleteSelectedTag(): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${this.selectedTag.name}?`;
        if (await this.promptService.open(this.translate.instant('Are you sure?'), content)) {
            await this.repo.delete(this.selectedTag);
            this.cancelEditing();
        }
    }

    public cancelEditing(): void {
        this.newTag = false;
        this.editTag = false;
        this.tagForm.reset();
    }

    /**
     * Select a row in the table
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
    public keyDownFunction(event: KeyboardEvent): void {
        if (event.keyCode === 27) {
            this.cancelEditing();
        }
    }
}
