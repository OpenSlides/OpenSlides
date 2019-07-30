import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { CsvColumnDefinitionProperty, CsvExportService } from 'app/core/ui-services/csv-export.service';
import { ViewStatuteParagraph } from '../models/view-statute-paragraph';

/**
 * Exports CSVs for statute paragraphs.
 */
@Injectable({
    providedIn: 'root'
})
export class StatuteCsvExportService {
    /**
     * Does nothing.
     *
     * @param csvExport CsvExportService
     * @param translate TranslateService
     */
    public constructor(private csvExport: CsvExportService, private translate: TranslateService) {}

    /**
     * Export all statute paragraphs as CSV
     *
     * @param statute statute PParagraphs to export
     */
    public exportStatutes(statutes: ViewStatuteParagraph[]): void {
        const exportProperties: CsvColumnDefinitionProperty<ViewStatuteParagraph>[] = [
            { property: 'title' },
            { property: 'text' }
        ];
        this.csvExport.export(statutes, exportProperties, this.translate.instant('Statute') + '.csv');
    }

    /**
     * Exports a short example file
     */
    public exportDummyCSV(): void {
        const header = ['Title', 'Text'];
        const rows = [
            ['§1', 'This is the first section'],
            ['§1, A 3', 'This is another important aspect'],
            ['§2', 'Yet another']
        ];
        const filename = `${this.translate.instant('Statute')}-${this.translate.instant('example')}.csv`;
        this.csvExport.dummyCSVExport(header, rows, filename);
    }
}
