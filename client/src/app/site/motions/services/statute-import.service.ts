import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Papa } from 'ngx-papaparse';
import { TranslateService } from '@ngx-translate/core';

import { BaseImportService, NewEntry } from 'app/core/ui-services/base-import.service';
import { StatuteParagraph } from 'app/shared/models/motions/statute-paragraph';
import { ViewStatuteParagraph } from '../models/view-statute-paragraph';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';

/**
 * Service for motion imports
 */
@Injectable({
    providedIn: 'root'
})
export class StatuteImportService extends BaseImportService<ViewStatuteParagraph> {
    /**
     * List of possible errors and their verbose explanation
     */
    public errorList = {
        Duplicates: 'A statute with this title already exists.'
    };

    /**
     * The minimimal number of header entries needed to successfully create an entry
     */
    public requiredHeaderLength = 2;

    /**
     * Constructor. Defines the headers expected and calls the abstract class
     * @param repo: The repository for statuteparagraphs.
     * @param translate Translation service
     * @param papa External csv parser (ngx-papaparser)
     * @param matSnackBar snackBar to display import errors
     */
    public constructor(
        private repo: StatuteParagraphRepositoryService,
        translate: TranslateService,
        papa: Papa,
        matSnackbar: MatSnackBar
    ) {
        super(translate, papa, matSnackbar);

        this.expectedHeader = ['title', 'text'];
    }

    /**
     * Clears all temporary data specific to this importer.
     */
    public clearData(): void {
        // does nothing
    }

    /**
     * Parses a string representing an entry, extracting secondary data, appending
     * the array of secondary imports as needed
     *
     * @param line
     * @returns a new Entry representing a Motion
     */
    public mapData(line: string): NewEntry<ViewStatuteParagraph> {
        const newEntry = new ViewStatuteParagraph(new StatuteParagraph());
        const headerLength = Math.min(this.expectedHeader.length, line.length);
        for (let idx = 0; idx < headerLength; idx++) {
            switch (this.expectedHeader[idx]) {
                case 'title':
                    newEntry.statuteParagraph.title = line[idx];
                    break;
                case 'text':
                    newEntry.statuteParagraph.text = line[idx];
                    break;
            }
        }
        const updateModels = this.repo.getViewModelList().filter(paragraph => paragraph.title === newEntry.title);
        return {
            newEntry: newEntry,
            duplicates: updateModels,
            status: updateModels.length ? 'error' : 'new',
            errors: updateModels.length ? ['Duplicates'] : []
        };
    }

    /**
     * Executes the import. Creates all entries without errors by submitting
     * them to the server. The entries will receive the status 'done' on success.
     */
    public async doImport(): Promise<void> {
        for (const entry of this.entries) {
            if (entry.status !== 'new') {
                continue;
            }
            await this.repo.create(entry.newEntry.statuteParagraph);
            entry.status = 'done';
        }
        this.updatePreview();
    }
}
