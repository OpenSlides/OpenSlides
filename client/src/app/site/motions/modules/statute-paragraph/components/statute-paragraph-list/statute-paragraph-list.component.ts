import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { StatuteParagraph } from 'app/shared/models/motions/statute-paragraph';
import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
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
export class StatuteParagraphListComponent extends BaseViewComponentDirective implements OnInit {
    @ViewChild('statuteParagraphDialog', { static: true })
    private statuteParagraphDialog: TemplateRef<string>;

    private dialogRef: MatDialogRef<any>;

    private currentStatuteParagraph: ViewStatuteParagraph | null;

    /**
     * Source of the Data
     */
    public statuteParagraphs: ViewStatuteParagraph[] = [];

    /**
     * Formgroup for creating and updating of statute paragraphs
     */
    public statuteParagraphForm: FormGroup;

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
        private dialog: MatDialog,
        private csvExportService: StatuteCsvExportService
    ) {
        super(titleService, translate, matSnackBar);

        const form = {
            title: ['', Validators.required],
            text: ['', Validators.required]
        };
        this.statuteParagraphForm = this.formBuilder.group(form);
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
     * Open the modal dialog
     */
    public openDialog(paragraph?: ViewStatuteParagraph): void {
        this.currentStatuteParagraph = paragraph;
        this.statuteParagraphForm.reset();
        if (paragraph) {
            this.statuteParagraphForm.setValue({
                title: paragraph.title,
                text: paragraph.text
            });
        }
        this.dialogRef = this.dialog.open(this.statuteParagraphDialog, largeDialogSettings);
        this.dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.save();
            }
        });
    }

    /**
     * creates a new statute paragraph or updates the current one
     */
    private save(): void {
        if (this.statuteParagraphForm.valid) {
            // eiher update or create
            if (this.currentStatuteParagraph) {
                this.repo
                    .update(this.statuteParagraphForm.value as Partial<StatuteParagraph>, this.currentStatuteParagraph)
                    .catch(this.raiseError);
            } else {
                const paragraph = new StatuteParagraph(this.statuteParagraphForm.value);
                this.repo.create(paragraph).catch(this.raiseError);
            }
            this.statuteParagraphForm.reset();
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
            this.repo.delete(viewStatuteParagraph).catch(this.raiseError);
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
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.save();
            this.dialogRef.close();
        }
        if (event.key === 'Escape') {
            this.dialogRef.close();
        }
    }

    /**
     * Triggers a csv export of the statute paragraphs
     */
    public onCsvExport(): void {
        this.csvExportService.exportStatutes(this.statuteParagraphs);
    }
}
