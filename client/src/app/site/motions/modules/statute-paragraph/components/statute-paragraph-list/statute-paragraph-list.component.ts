import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { StatuteParagraph } from 'app/shared/models/motions/statute-paragraph';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewStatuteParagraph } from 'app/site/motions/models/view-statute-paragraph';
import { StatuteCsvExportService } from 'app/site/motions/services/statute-csv-export.service';

/**
 * List view for the statute paragraphs.
 */
@Component({
    selector: 'os-statute-paragraph-list',
    templateUrl: './statute-paragraph-list.component.html',
    styleUrls: ['./statute-paragraph-list.component.scss']
})
export class StatuteParagraphListComponent extends BaseViewComponent implements OnInit {
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
     * The usual component constructor. Initializes the forms
     *
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param formBuilder
     * @param promptService
     * @param csvExportService
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private repo: StatuteParagraphRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private csvExportService: StatuteCsvExportService
    ) {
        super(titleService, translate, matSnackBar);

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
     * Sets the title and gets/observes statute paragraphs from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Statute');
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

    /**
     * Handler when clicking on create to create a new statute paragraph
     */
    public create(): void {
        if (this.createForm.valid) {
            this.statuteParagraphToCreate.patchValues(this.createForm.value as StatuteParagraph);
            this.repo.create(this.statuteParagraphToCreate).then(() => {
                this.statuteParagraphToCreate = null;
            }, this.raiseError);
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
     * Saves the statute paragraph
     * @param viewStatuteParagraph The statute paragraph to save
     */
    public onSaveButton(viewStatuteParagraph: ViewStatuteParagraph): void {
        if (this.updateForm.valid) {
            this.repo.update(this.updateForm.value as Partial<StatuteParagraph>, viewStatuteParagraph).then(() => {
                this.openId = this.editId = null;
            }, this.raiseError);
        }
    }

    /**
     * Is executed, when the delete button is pressed
     * @param viewStatuteParagraph The statute paragraph to delete
     */
    public async onDeleteButton(viewStatuteParagraph: ViewStatuteParagraph): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this statute paragraph?');
        const content = viewStatuteParagraph.title;
        if (await this.promptService.open(title, content)) {
            this.repo.delete(viewStatuteParagraph).then(() => (this.openId = this.editId = null), this.raiseError);
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

    /**
     * TODO: navigate to a sorting view
     */
    public sortStatuteParagraphs(): void {
        console.log('Not yet implemented. Depends on other Features');
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDownCreate(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.create();
        }
        if (event.key === 'Escape') {
            this.onCancelCreate();
        }
    }

    /**
     * Cancels the current form action
     */
    public onCancelCreate(): void {
        this.statuteParagraphToCreate = null;
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDownUpdate(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            const myParagraph = this.statuteParagraphs.find(x => x.id === this.editId);
            this.onSaveButton(myParagraph);
        }
        if (event.key === 'Escape') {
            this.onCancelUpdate();
        }
    }

    /**
     * Cancels the current form action
     */
    public onCancelUpdate(): void {
        this.editId = null;
    }

    /**
     * Triggers a csv export of the statute paragraphs
     */
    public onCsvExport(): void {
        this.csvExportService.exportStatutes(this.statuteParagraphs);
    }
}
