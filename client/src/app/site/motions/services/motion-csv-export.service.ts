import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import {
    CsvColumnDefinitionMap,
    CsvColumnDefinitionProperty,
    CsvExportService
} from 'app/core/ui-services/csv-export.service';
import { LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { ViewUnifiedChange } from 'app/shared/models/motions/view-unified-change';
import { reconvertChars } from 'app/shared/utils/reconvert-chars';
import { stripHtmlTags } from 'app/shared/utils/strip-html-tags';
import { ChangeRecoMode, sortMotionPropertyList } from '../motions.constants';
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
     * @param configService ConfigService
     * @param linenumberingService LinenumberingService
     * @param changeRecoRepo ChangeRecommendationRepositoryService
     * @param motionRepo MotionRepositoryService
     */
    public constructor(
        private csvExport: CsvExportService,
        private translate: TranslateService,
        private configService: ConfigService,
        private linenumberingService: LinenumberingService,
        private changeRecoRepo: ChangeRecommendationRepositoryService,
        private motionRepo: MotionRepositoryService,
        private commentRepo: MotionCommentSectionRepositoryService
    ) {}

    /**
     * Creates the motion text
     *
     * @param motion the motion to convert to pdf
     * @param crMode determine the used change Recommendation mode
     * @returns doc def for the "the assembly may decide" preamble
     */
    private createText(motion: ViewMotion, crMode: ChangeRecoMode): string {
        // get the line length from the config
        const lineLength = this.configService.instant<number>('motions_line_length');

        // lead motion or normal amendments
        // TODO: Consider title change recommendation
        const changes: ViewUnifiedChange[] = Object.assign([], this.changeRecoRepo.getChangeRecoOfMotion(motion.id));

        // TODO: Cleanup, everything change reco and amendment based needs a unified structure.
        const amendments = this.motionRepo.getAmendmentsInstantly(motion.id);
        if (amendments) {
            for (const amendment of amendments) {
                const changeRecos = this.changeRecoRepo
                    .getChangeRecoOfMotion(amendment.id)
                    .filter(reco => reco.showInFinalView());
                const changedParagraphs = this.motionRepo.getAmendmentAmendedParagraphs(
                    amendment,
                    lineLength,
                    changeRecos
                );
                for (const change of changedParagraphs) {
                    changes.push(change as ViewUnifiedChange);
                }
            }
        }

        // changes need to be sorted, by "line from".
        // otherwise, formatMotion will make unexpected results by messing up the
        // order of changes applied to the motion
        changes.sort((a, b) => a.getLineFrom() - b.getLineFrom());
        const text = this.motionRepo.formatMotion(motion.id, crMode, changes, lineLength);

        return this.linenumberingService.stripLineNumbers(text);
    }

    /**
     * Export all motions as CSV
     *
     * @param motions Motions to export
     * @param contentToExport content properties to export
     * @param crMode
     */
    public exportMotionList(
        motions: ViewMotion[],
        contentToExport: string[],
        comments: number[],
        crMode?: ChangeRecoMode
    ): void {
        if (!crMode) {
            crMode = this.configService.instant('motions_recommendation_text_mode');
        }

        const properties = sortMotionPropertyList(['identifier', 'title'].concat(contentToExport));
        const exportProperties: (
            | CsvColumnDefinitionProperty<ViewMotion>
            | CsvColumnDefinitionMap<ViewMotion>
        )[] = properties.map(option => {
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
            } else if (option === 'text') {
                return {
                    label: 'Text',
                    map: motion => this.createText(motion, crMode)
                };
            } else if (option === 'motion_block') {
                return {
                    label: 'Motion block',
                    map: motion => (motion.motion_block ? motion.motion_block.getTitle() : '')
                };
            } else {
                return { property: option } as CsvColumnDefinitionProperty<ViewMotion>;
            }
        });
        exportProperties.push(
            ...comments.map(commentId => ({
                label: this.commentRepo.getViewModel(commentId).getTitle(),
                map: (motion: ViewMotion) => {
                    const viewComment = this.commentRepo.getViewModel(commentId);
                    const motionComment = motion.getCommentForSection(viewComment);
                    return motionComment && motionComment.comment
                        ? reconvertChars(stripHtmlTags(motionComment.comment))
                        : '';
                }
            }))
        );

        this.csvExport.export(motions, exportProperties, this.translate.instant('Motions') + '.csv');
    }

    /**
     * Exports the call list.
     *
     * @param motions All motions in the CSV. They should be ordered by weight correctly.
     */
    public exportCallList(motions: ViewMotion[]): void {
        this.csvExport.export(
            motions,
            [
                { label: 'Called', map: motion => (motion.sort_parent_id ? '' : motion.identifierOrTitle) },
                { label: 'Called with', map: motion => (!motion.sort_parent_id ? '' : motion.identifierOrTitle) },
                { label: 'submitters', map: motion => motion.submittersAsUsers.map(s => s.short_name).join(',') },
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
        const headerRow = [
            'Identifier',
            'Submitters',
            'Title',
            'Text',
            'Reason',
            'Category',
            'Tags',
            'Motion block',
            'Origin'
        ];
        const rows = [
            [
                'A1',
                'Submitter A',
                'Title 1',
                'Text 1',
                'Reason 1',
                'Category A',
                'Tag 1, Tag 2',
                'Block A',
                'Last Year Conference A'
            ],
            ['B1', 'Submitter B', 'Title 2', 'Text 2', 'Reason 2', 'Category B', null, 'Block A', 'Origin B'],
            ['C2', null, 'Title 3', 'Text 3', null, null, null, null, null]
        ];
        this.csvExport.dummyCSVExport(headerRow, rows, `${this.translate.instant('motions-example')}.csv`);
    }
}
