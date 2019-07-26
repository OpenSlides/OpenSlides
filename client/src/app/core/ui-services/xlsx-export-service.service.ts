import { Injectable } from '@angular/core';

import { Color, FillPatterns, Workbook, Worksheet } from 'exceljs/dist/exceljs.min.js';
import { saveAs } from 'file-saver';

// interface required for filling cells (`cell.fill`)
export interface CellFillingDefinition {
    type: 'pattern';
    pattern: FillPatterns;
    fgColor: Partial<Color>;
    bgColor: Partial<Color>;
}

@Injectable({
    providedIn: 'root'
})
export class XlsxExportServiceService {
    /**
     * Correction factor for cell width alignment
     */
    private PIXELS_PER_EXCEL_WIDTH_UNIT = 7.5;

    /**
     * Constructor
     */
    public constructor() {}

    /**
     * Saves the given workflow
     *
     * @param workbook The workflow to export
     * @param fileName The filename to save to workflow to
     */
    public saveXlsx(workbook: Workbook, fileName: string): void {
        workbook.xlsx.writeBuffer().then(blobData => {
            const blob = new Blob([blobData as BlobPart], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            saveAs(blob, `${fileName}.xlsx`);
        });
    }

    /**
     * helper function to automatically resize the columns of the given Worksheet.
     * Will manipulate the parameter.
     * TODO: Upstream ExcelJS issue for auto column width:
     *       https://github.com/exceljs/exceljs/issues/83
     *
     * @param sheet The sheet to resize
     * @param fromRow the row number to start detecting the size
     */
    public autoSize(sheet: Worksheet, fromRow: number): void {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const maxColumnLengths: number[] = [];
        sheet.eachRow((row, rowNum) => {
            if (rowNum < fromRow) {
                return;
            }

            row.eachCell((cell, num) => {
                if (typeof cell.value === 'string') {
                    if (maxColumnLengths[num] === undefined) {
                        maxColumnLengths[num] = 0;
                    }

                    const fontSize = cell.font && cell.font.size ? cell.font.size : 11;
                    ctx.font = `${fontSize}pt Arial`;
                    const metrics = ctx.measureText(cell.value);
                    const cellWidth = metrics.width;

                    maxColumnLengths[num] = Math.max(maxColumnLengths[num], cellWidth);
                }
            });
        });

        for (let i = 1; i <= sheet.columnCount; i++) {
            const col = sheet.getColumn(i);
            const width = maxColumnLengths[i];
            if (width) {
                col.width = width / this.PIXELS_PER_EXCEL_WIDTH_UNIT + 1;
            }
        }
    }

    /**
     * Tries to calculate a fitting row hight for a given text
     *
     * @param title The text to analyse
     * @param columnWidth the width of the column to fit the text in
     */
    public calcRowHeight(title: string, columnWidth: number): number {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '14pt Arial';
        const metricsWidth = Math.floor(ctx.measureText(title).width);
        const factor = Math.ceil(metricsWidth / (columnWidth * 10));
        // add 1 for correction
        return factor + 1;
    }
}
