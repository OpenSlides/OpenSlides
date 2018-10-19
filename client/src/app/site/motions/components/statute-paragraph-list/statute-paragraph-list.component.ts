import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PromptService } from '../../../../core/services/prompt.service';
import { StatuteParagraph } from '../../../../shared/models/motions/statute-paragraph';
import { ViewStatuteParagraph } from '../../models/view-statute-paragraph';
import { StatuteParagraphRepositoryService } from '../../services/statute-paragraph-repository.service';
import { EllipsisMenuItem } from '../../../../shared/components/head-bar/head-bar.component';

/**
 * List view for the statute paragraphs.
 */
@Component({
    selector: 'os-statute-paragraph-list',
    templateUrl: './statute-paragraph-list.component.html',
    styleUrls: ['./statute-paragraph-list.component.scss']
})
export class StatuteParagraphListComponent extends BaseComponent implements OnInit {
    /**
     * content of the ellipsis menu
     */
    public menuList: EllipsisMenuItem[] = [
        {
            text: 'Sort statute paragraphs',
            action: 'sortStatuteParagraphs'
        }
    ];

    public statuteParagraphToCreate: StatuteParagraph | null;

    /**
     * Source of the Data
     */
    public statuteParagraphs: ViewStatuteParagraph[] = [];

    /**
     * The current focussed formgroup
     */
    public updateForm: FormGroup;

    public createForm: FormGroup;

    public openId: number | null;
    public editId: number | null;

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
        private repo: StatuteParagraphRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService
    ) {
        super(titleService, translate);
        const form = {
            title: ['', Validators.required],
            text: ['', Validators.required]
        };
        this.createForm = this.formBuilder.group(form);
        this.updateForm = this.formBuilder.group(form);
    }

    /**
     * Init function.
     *
     * Sets the title and gets/observes statute paragrpahs from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Statute paragraphs');
        this.repo.getViewModelListObservable().subscribe(newViewStatuteParagraphs => {
            this.statuteParagraphs = newViewStatuteParagraphs;
        });
    }

    /**
     * Add a new Section.
     */
    public onPlusButton(): void {
        if (!this.statuteParagraphToCreate) {
            this.createForm.reset();
            this.createForm.setValue({
                title: '',
                text: ''
            });
            this.statuteParagraphToCreate = new StatuteParagraph();
        }
    }

    public create(): void {
        if (this.createForm.valid) {
            this.statuteParagraphToCreate.patchValues(this.createForm.value as StatuteParagraph);
            this.repo.create(this.statuteParagraphToCreate).subscribe(resp => {
                this.statuteParagraphToCreate = null;
            });
        }
    }

    /**
     * Executed on edit button
     * @param viewStatuteParagraph
     */
    public onEditButton(viewStatuteParagraph: ViewStatuteParagraph): void {
        this.editId = viewStatuteParagraph.id;

        this.updateForm.setValue({
            title: viewStatuteParagraph.title,
            text: viewStatuteParagraph.text
        });
    }

    /**
     * Saves the statute paragrpah
     */
    public onSaveButton(viewStatuteParagraph: ViewStatuteParagraph): void {
        if (this.updateForm.valid) {
            this.repo
                .update(this.updateForm.value as Partial<StatuteParagraph>, viewStatuteParagraph)
                .subscribe(resp => {
                    this.openId = this.editId = null;
                });
        }
    }

    /**
     * is executed, when the delete button is pressed
     */
    public async onDeleteButton(viewStatuteParagraph: ViewStatuteParagraph): Promise<any> {
        const content = this.translate.instant('Delete') + ` ${viewStatuteParagraph.title}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.delete(viewStatuteParagraph).subscribe(resp => {
                this.openId = this.editId = null;
            });
        }
    }

    /**
     * Is executed when a mat-extension-panel is closed
     * @param viewStatuteParagraph the statute paragraph in the panel
     */
    public panelClosed(viewStatuteParagraph: ViewStatuteParagraph): void {
        this.openId = null;
        if (this.editId) {
            this.onSaveButton(viewStatuteParagraph);
        }
    }

    public onEllipsisItem(item: EllipsisMenuItem): void {
        if (item.action === 'sortStatuteParagrpahs') {
            this.sortStatuteParagrpahs();
        }
    }

    /**
     * TODO: navigate to a sorting view
     */
    public sortStatuteParagrpahs(): void {
        console.log('sort statute paragraphs');
    }
}
