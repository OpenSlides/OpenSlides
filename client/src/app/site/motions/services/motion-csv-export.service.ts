import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import {
    CsvExportService,
    CsvColumnDefinitionProperty,
    CsvColumnDefinitionMap
} from 'app/core/ui-services/csv-export.service';
import { sortMotionPropertyList } from '../motion-import-export-order';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { ViewMotion } from '../models/view-motion';

/**
 * Exports CSVs for motions. Collect all CSV types here to have them in one place.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionCsvExportService {
    /**
     * Does nothing.
     *
     * @param csvExport CsvExportService
     * @param translate TranslateService
     */
    public constructor(
        private csvExport: CsvExportService,
        private translate: TranslateService,
        private motionRepo: MotionRepositoryService
    ) {}

    /**
     * Export all motions as CSV
     *
     * @param motions Motions to export
     * @param contentToExport content properties to export
     */
    public exportMotionList(motions: ViewMotion[], contentToExport: string[]): void {
        const properties = sortMotionPropertyList(['identifier', 'title'].concat(contentToExport));
        const exportProperties: (
            | CsvColumnDefinitionProperty<ViewMotion>
            | CsvColumnDefinitionMap<ViewMotion>)[] = properties.map(option => {
            if (option === 'recommendation') {
                return {
                    label: 'recommendation',
                    map: motion => this.motionRepo.getExtendedRecommendationLabel(motion)
                };
            } else if (option === 'state') {
                return {
                    label: 'state',
                    map: motion => this.motionRepo.getExtendedStateLabel(motion)
                };
            } else if (option === 'motion_block') {
                return {
                    label: 'Motion block',
                    map: motion => (motion.motion_block ? motion.motion_block.getTitle() : '')
                };
            } else if (option === 'text') {
                return {
                    label: 'Final text',
                    map: motion => (motion.modified_final_version ? motion.modified_final_version : motion.text)
                };
            } else {
                return { property: option } as CsvColumnDefinitionProperty<ViewMotion>;
            }
        });

        this.csvExport.export(motions, exportProperties, this.translate.instant('Motions') + '.csv');
    }

    /**
     * Exports the call list.
     *
     * @param motions All motions in the CSV. They should be ordered by callListWeight correctly.
     */
    public exportCallList(motions: ViewMotion[]): void {
        this.csvExport.export(
            motions,
            [
                { label: 'Called', map: motion => (motion.sort_parent_id ? '' : motion.identifierOrTitle) },
                { label: 'Called with', map: motion => (!motion.sort_parent_id ? '' : motion.identifierOrTitle) },
                { label: 'submitters', map: motion => motion.submitters.map(s => s.short_name).join(',') },
                { property: 'title' },
                {
                    label: 'recommendation',
                    map: motion => (motion.recommendation ? this.motionRepo.getExtendedRecommendationLabel(motion) : '')
                },
                { property: 'motion_block', label: 'Motion block' }
            ],
            this.translate.instant('Call list') + '.csv'
        );
    }

    // TODO does not reflect updated export order. any more. Hard coded for now
    public exportDummyMotion(): void {
        const headerRow = ['Identifier', 'Title', 'Text', 'Reason', 'Submitters', 'Category', 'Origin', 'Motion block'];
        const rows = [
            ['A1', 'Title 1', 'Text 1', 'Reason 1', 'Submitter A', 'Category A', 'Last Year Conference A', 'Block A'],
            ['B1', 'Title 2', 'Text 2', 'Reason 2', 'Submitter B', 'Category B', null, 'Block A'],
            [null, 'Title 3', 'Text 3', null, null, null, null, null]
        ];
        this.csvExport.dummyCSVExport(headerRow, rows, `${this.translate.instant('motions-example')}.csv`);
    }
}
