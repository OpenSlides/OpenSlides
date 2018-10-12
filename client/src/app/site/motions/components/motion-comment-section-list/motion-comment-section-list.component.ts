import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MotionCommentSection } from '../../../../shared/models/motions/motion-comment-section';
import { ViewMotionCommentSection } from '../../models/view-motion-comment-section';
import { MotionCommentSectionRepositoryService } from '../../services/motion-comment-section-repository.service';
import { BehaviorSubject } from 'rxjs';
import { Group } from '../../../../shared/models/users/group';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * List view for the categories.
 */
@Component({
    selector: 'os-motion-comment-section-list',
    templateUrl: './motion-comment-section-list.component.html',
    styleUrls: ['./motion-comment-section-list.component.scss']
})
export class MotionCommentSectionListComponent extends BaseComponent implements OnInit {
    public commentSectionToCreate: MotionCommentSection | null;

    /**
     * Source of the Data
     */
    public commentSections: ViewMotionCommentSection[] = [];

    /**
     * The current focussed formgroup
     */
    public updateForm: FormGroup;

    public createForm: FormGroup;

    public openId: number | null;
    public editId: number | null;

    public groups: BehaviorSubject<Array<Group>>;

    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     * @param repo
     * @param formBuilder
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private repo: MotionCommentSectionRepositoryService,
        private formBuilder: FormBuilder,
        private DS: DataStoreService
    ) {
        super(titleService, translate);
        const form = {
            name: ['', Validators.required],
            read_groups_id: [[]],
            write_groups_id: [[]]
        };
        this.createForm = this.formBuilder.group(form);
        this.updateForm = this.formBuilder.group(form);
    }

    /**
     * Event on Key Down in update or create form. Do not provide the viewSection for the create form.
     */
    public keyDownFunction(event: KeyboardEvent, viewSection?: ViewMotionCommentSection): void {
        if (event.keyCode === 13) {
            if (viewSection) {
                this.onSaveButton(viewSection);
            } else {
                this.create();
            }
        }
    }

    /**
     * Init function.
     *
     * Sets the title and gets/observes categories from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Comment Sections');
        this.groups = new BehaviorSubject(this.DS.getAll(Group));
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof Group) {
                this.groups.next(this.DS.getAll(Group));
            }
        });
        this.repo.getViewModelListObservable().subscribe(newViewSections => {
            this.commentSections = newViewSections;
        });
    }

    /**
     * Add a new Section.
     */
    public onPlusButton(): void {
        if (!this.commentSectionToCreate) {
            this.commentSectionToCreate = new MotionCommentSection();
            this.createForm.setValue({
                name: '',
                read_groups_id: [],
                write_groups_id: []
            });
        }
    }

    public create(): void {
        if (this.createForm.valid) {
            this.commentSectionToCreate.patchValues(this.createForm.value as MotionCommentSection);
            this.repo.create(this.commentSectionToCreate).subscribe(resp => {
                this.commentSectionToCreate = null;
            });
        }
    }

    /**
     * Executed on edit button
     * @param viewSection
     */
    public onEditButton(viewSection: ViewMotionCommentSection): void {
        this.editId = viewSection.id;

        this.updateForm.setValue({
            name: viewSection.name,
            read_groups_id: viewSection.read_groups_id,
            write_groups_id: viewSection.write_groups_id
        });
    }

    /**
     * Saves the categories
     */
    public onSaveButton(viewSection: ViewMotionCommentSection): void {
        if (this.updateForm.valid) {
            this.repo.update(this.updateForm.value as Partial<MotionCommentSection>, viewSection).subscribe(resp => {
                this.openId = this.editId = null;
            });
        }
    }

    /**
     * is executed, when the delete button is pressed
     */
    public async onDeleteButton(viewSection: ViewMotionCommentSection): Promise<any> {
        try {
            await this.repo.delete(viewSection);
            this.openId = this.editId = null;
        } catch (e) {
            if (e instanceof HttpErrorResponse) {
                // Todo: Error handling
            }
        }
    }

    /**
     * Is executed when a mat-extension-panel is closed
     * @param viewSection the category in the panel
     */
    public panelClosed(viewSection: ViewMotionCommentSection): void {
        this.openId = null;
        if (this.editId) {
            this.onSaveButton(viewSection);
        }
    }
}
