import { Injectable } from '@angular/core';

import { Workbook } from 'exceljs';

import { InfoToExport } from './motion-pdf.service';
import { ViewMotion } from '../models/view-motion';
import { XlsxExportServiceService } from 'app/core/ui-services/xlsx-export-service.service';
import { TranslateService } from '@ngx-translate/core';

/**
 * Service to export motion elements to XLSX
 */
@Injectable({
    providedIn: 'root'
})
export class MotionXlsxExportService {
    /**
     * Constructor
     */
    public constructor(private xlsx: XlsxExportServiceService, private translate: TranslateService) {}

    /**
     * Export motions as XLSX
     *
     * @param motions
     * @param contentToExport
     * @param infoToExport
     */
    public exportMotionList(motions: ViewMotion[], infoToExport: InfoToExport[]): void {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet(this.translate.instant('Motions'));
        const properties = ['identifier', 'title'].concat(infoToExport);

        // if the ID was exported as well, shift it to the first position
        if (properties[properties.length - 1] === 'id') {
            properties.unshift(properties.pop());
        }

        worksheet.columns = properties.map(property => {
            return {
                header: this.translate.instant(property.charAt(0).toLocaleUpperCase() + property.slice(1))
            };
        });

        // style the header row
        worksheet.getRow(1).font = {
            underline: true,
            bold: true
        };

        // map motion data to properties
        const motionData = motions.map(motion =>
            properties.map(property => {
                const motionProp = motion[property];
                if (motionProp) {
                    return this.translate.instant(motionProp.toString());
                } else {
                    return null;
                }
            })
        );

        // add to sheet
        for (const motion of motionData) {
            worksheet.addRow(motion);
        }

        this.xlsx.autoSize(worksheet, 0);
        this.xlsx.saveXlsx(workbook, this.translate.instant('Motions'));
    }
}
