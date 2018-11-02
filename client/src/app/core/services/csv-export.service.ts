import { BaseViewModel } from '../../site/base/base-view-model';
import { Injectable } from '@angular/core';
import { FileExportService } from './file-export.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class CsvExportService {
    /**
     * Constructor
     */
    public constructor(protected exporter: FileExportService, private translate: TranslateService) {}

    /**
     * Saves an array of model data to a CSV.
     * @param data Array of Model instances to be saved
     * @param columns Column definitions
     * @param filename name of the resulting file
     * @param options optional:
     *      lineSeparator (defaults to \r\n windows style line separator),
     *      columnseparator defaults to semicolon (other usual separators are ',' '\T' (tab), ' 'whitespace)
     */
    public export<T extends BaseViewModel>(
        data: T[],
        columns: {
            property: keyof T; // name of the property used for export
            label?: string;
            assemble?: string; // (if property is further child object, the property of these to be used)
        }[],
        filename: string,
        { lineSeparator = '\r\n', columnSeparator = ';' }: { lineSeparator?: string; columnSeparator?: string } = {}
    ): void {
        const allLines = []; // Array of arrays of entries
        const usedColumns = []; // mapped properties to be included

        // initial array of usable text separators. The first character not used
        // in any text data or as column separator will be used as text separator
        let tsList = ['"', "'", '`', '/', '\\', ';', '.'];

        if (lineSeparator === columnSeparator) {
            throw new Error('lineseparator and columnseparator must differ from each other');
        }

        tsList = this.checkCsvTextSafety(lineSeparator, tsList);
        tsList = this.checkCsvTextSafety(columnSeparator, tsList);

        // create header data
        const header = [];
        columns.forEach(column => {
            const rawLabel: string = column.label ? column.label : (column.property as string);
            const colLabel = this.capitalizeTranslate(rawLabel);
            tsList = this.checkCsvTextSafety(colLabel, tsList);
            header.push(colLabel);
            usedColumns.push(column.property);
        });
        allLines.push(header);
        // create lines
        data.forEach(item => {
            const line = [];
            for (let i = 0; i < usedColumns.length; i++ ){
                const property = usedColumns[i];
                let prop: any = item[property];
                if (columns[i].assemble){
                    prop = item[property].map(subitem => this.translate.instant(subitem[columns[i].assemble])).join(',');
                }
                tsList = this.checkCsvTextSafety(prop, tsList);
                line.push(prop);
            };
            allLines.push(line);
        });

        // assemble lines, putting text separator in place
        if (!tsList.length) {
            throw new Error('no usable text separator left for valid csv text');
        }

        const allLinesAssembled = [];
        allLines.forEach(line => {
            const assembledLine = [];
            line.forEach(item => {
                if (typeof item === 'number') {
                    assembledLine.push(item.toString(10));
                } else if (item === null || item === undefined || item === '') {
                    assembledLine.push('');
                } else if (item === true) {
                    assembledLine.push('1');
                } else if (item === false) {
                    assembledLine.push('0');
                } else {
                    assembledLine.push(tsList[0] + item + tsList[0]);
                }
            });
            allLinesAssembled.push(assembledLine.join(columnSeparator));
        });
        this.exporter.saveFile(allLinesAssembled.join(lineSeparator), filename);
    }

    /**
     * Checks if a given input contains any of the characters defined in a list
     * used for textseparators. The list is then returned without the 'special'
     * characters, as they may not be used as text separator in this csv.
     * @param input any input to be sent to CSV
     * @param tsList The list of special characters to check.
     */
    public checkCsvTextSafety(input: any, tsList: string[]): string[] {
        if (input === null || input === undefined ) {
            return tsList;
        }

        const inputAsString = String(input);
        return tsList.filter(char => inputAsString.indexOf(char) < 0);
    }

    private capitalizeTranslate(input: string): string {
        const temp = input.charAt(0).toUpperCase() + input.slice(1);
        return this.translate.instant(temp);
    }
}
