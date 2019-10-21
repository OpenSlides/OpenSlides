import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Workbook } from 'exceljs/dist/exceljs.min.js';

import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { CellFillingDefinition, XlsxExportServiceService } from 'app/core/ui-services/xlsx-export-service.service';
import { reconvertChars } from 'app/shared/utils/reconvert-chars';
import { stripHtmlTags } from 'app/shared/utils/strip-html-tags';
import { sortMotionPropertyList } from '../motions.constants';
import { InfoToExport } from '../motions.constants';
import { ViewMotion } from '../models/view-motion';

/**
 * Service to export motion elements to XLSX
 */
@Injectable({
    providedIn: 'root'
})
export class MotionXlsxExportService {
    /**
     * Determine the default font size
     */
    private fontSize = 12;

    /**
     * The defa
     */
    private fontName = 'Arial';

    /**
     * Defines the head row style
     */
    private headRowFilling: CellFillingDefinition = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFFFE699'
        },
        bgColor: {
            argb: 'FFFFE699'
        }
    };

    /**
     * Filling Style of odd rows
     */
    private oddFilling: CellFillingDefinition = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFDDDDDD'
        },
        bgColor: {
            argb: 'FFDDDDDD'
        }
    };

    /**
     * Constructor
     *
     * @param xlsx XlsxExportServiceService
     * @param translate translationService
     * @param motionRepo MotionRepositoryService
     */
    public constructor(
        private xlsx: XlsxExportServiceService,
        private translate: TranslateService,
        private motionRepo: MotionRepositoryService,
        private commentRepo: MotionCommentSectionRepositoryService
    ) {}

    /**
     * Export motions as XLSX
     *
     * @param motions
     * @param contentToExport
     * @param infoToExport
     * @param comments The ids of the comments, that will be exported, too.
     */
    public exportMotionList(motions: ViewMotion[], infoToExport: InfoToExport[], comments: number[]): void {
        const workbook = new Workbook();
        const properties = infoToExport.includes('speakers')
            ? sortMotionPropertyList(['identifier', 'title'].concat(infoToExport)).concat('speakers')
            : sortMotionPropertyList(['identifier', 'title'].concat(infoToExport));

        const worksheet = workbook.addWorksheet(this.translate.instant('Motions'), {
            pageSetup: {
                paperSize: 9,
                orientation: 'landscape',
                fitToPage: true,
                fitToHeight: 5,
                fitToWidth: properties.length,
                printTitlesRow: '1:1',
                margins: {
                    left: 0.4,
                    right: 0.4,
                    top: 1.0,
                    bottom: 0.5,
                    header: 0.3,
                    footer: 0.3
                }
            }
        });

        const columns = [];
        columns.push(
            ...properties.map(property => {
                let propertyHeader = '';
                switch (property) {
                    case 'motion_block':
                        propertyHeader = 'Motion block';
                        break;
                    case 'speakers':
                        propertyHeader = 'Open requests to speak';
                        break;
                    default:
                        propertyHeader = property.charAt(0).toUpperCase() + property.slice(1);
                }
                return {
                    header: this.translate.instant(propertyHeader)
                };
            })
        );
        if (comments) {
            columns.push(
                ...comments.map(commentId => ({ header: this.commentRepo.getViewModel(commentId).getTitle() }))
            );
        }

        worksheet.columns = columns;

        worksheet.getRow(1).eachCell(cell => {
            cell.font = {
                name: this.fontName,
                size: this.fontSize,
                underline: true,
                bold: true
            };
            cell.fill = this.headRowFilling;
        });

        // map motion data to properties
        const motionData = motions.map(motion => {
            const data = [];
            data.push(
                ...properties.map(property => {
                    const motionProp = motion[property];
                    /*if (property === 'speakers') {
                        return motion.listOfSpeakers && motion.listOfSpeakers.waitingSpeakerAmount > 0
                            ? motion.listOfSpeakers.waitingSpeakerAmount
                            : '';
                    }*/
                    if (!motionProp) {
                        return '';
                    }
                    switch (property) {
                        case 'state':
                            return this.motionRepo.getExtendedStateLabel(motion);
                        case 'recommendation':
                            return this.motionRepo.getExtendedRecommendationLabel(motion);
                        default:
                            return this.translate.instant(motionProp.toString());
                    }
                })
            );
            if (comments) {
                data.push(
                    ...comments.map(commentId => {
                        const section = this.commentRepo.getViewModel(commentId);
                        const motionComment = motion.getCommentForSection(section);
                        return motionComment && motionComment.comment
                            ? reconvertChars(stripHtmlTags(motionComment.comment))
                            : '';
                    })
                );
            }
            return data;
        });

        // add to sheet
        for (let i = 0; i < motionData.length; i++) {
            const row = worksheet.addRow(motionData[i]);
            row.eachCell(cell => {
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                cell.font = {
                    name: this.fontName,
                    size: this.fontSize
                };
                // zebra styled filling
                if (i % 2 !== 0) {
                    cell.fill = this.oddFilling;
                }
            });
        }

        this.xlsx.autoSize(worksheet, 0);
        this.xlsx.saveXlsx(workbook, this.translate.instant('Motions'));
    }
}
