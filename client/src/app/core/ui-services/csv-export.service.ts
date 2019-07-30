import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from '../../site/base/base-view-model';
import { ConfigService } from './config.service';
import { FileExportService } from './file-export.service';

/**
 * Defines a csv column with a property of the model and an optional label. If this is not given, the
 * translated and capitalized property name is used.
 */
export interface CsvColumnDefinitionProperty<T> {
    label?: string;
    property: keyof T;
}

/**
 * Type assertion for CsvColumnDefinitionProperty<T>
 *
 * @param obj Any object to test.
 * @returns true, if the object is a property definition. This is also asserted for TypeScript.
 */
function isPropertyDefinition<T>(obj: any): obj is CsvColumnDefinitionProperty<T> {
    return (<CsvColumnDefinitionProperty<T>>obj).property !== undefined;
}

/**
 * Defines a csv column with a map function. Here, the user of this service can define hat should happen with
 * all the models. This map function is called for every model and the user should return a string that is
 * put into the csv. Also a column label must be given, that is capitalized and translated.
 */
export interface CsvColumnDefinitionMap<T> {
    label: string;
    map: (model: T) => string;
}

/**
 * Type assertion for CsvColumnDefinitionMap<T>
 *
 * @param obj Any object to test.
 * @returns true, if the objct is a map definition. This is also asserted for TypeScript.
 */
function isMapDefinition<T>(obj: any): obj is CsvColumnDefinitionMap<T> {
    const columnDefinitionMap = <CsvColumnDefinitionMap<T>>obj;
    return columnDefinitionMap.map !== undefined && columnDefinitionMap.label !== undefined;
}

/**
 * The definition of columns in the export. Either use a property for every model or do a custom mapping to
 * a string to be put into the csv.
 */
type CsvColumnsDefinition<T> = (CsvColumnDefinitionProperty<T> | CsvColumnDefinitionMap<T>)[];

@Injectable({
    providedIn: 'root'
})
export class CsvExportService {
    /**
     * Constructor
     *
     * @param exporter helper to export something as file
     * @param translate translation serivice
     * @param config Configuration Service
     */
    public constructor(
        protected exporter: FileExportService,
        private translate: TranslateService,
        private config: ConfigService
    ) {}

    /**
     * Saves an array of model data to a CSV.
     * @param models Array of model instances to be saved
     * @param columns Column definitions
     * @param filename name of the resulting file
     * @param options optional:
     *      lineSeparator (defaults to \r\n windows style line separator),
     *      columnseparator defaults to configured option (',' , other values are ';', '\t' (tab), ' 'whitespace)
     */
    public export<T extends BaseViewModel>(
        models: T[],
        columns: CsvColumnsDefinition<T>,
        filename: string,
        {
            lineSeparator = '\r\n',
            columnSeparator = this.config.instant('general_csv_separator'),
            encoding = this.config.instant('general_csv_encoding')
        }: {
            lineSeparator?: string;
            columnSeparator?: string;
            encoding?: 'utf-8' | 'iso-8859-15';
        } = {}
    ): void {
        let csvContent = []; // Holds all lines as arrays with each column-value
        // initial array of usable text separators. The first character not used
        // in any text data or as column separator will be used as text separator

        if (lineSeparator === columnSeparator) {
            throw new Error('lineseparator and columnseparator must differ from each other');
        }

        // create header data
        const header = columns.map(column => {
            let label: string;
            if (isPropertyDefinition(column)) {
                label = column.label ? column.label : (column.property as string);
            } else if (isMapDefinition(column)) {
                label = column.label;
            }
            label = this.capitalizeTranslate(label);
            return label;
        });
        csvContent.push(header);

        // create lines
        csvContent = csvContent.concat(
            models.map(model =>
                columns.map(column => {
                    let value: string;

                    if (isPropertyDefinition(column)) {
                        const property: any = model[column.property];
                        if (typeof property === 'number') {
                            value = property.toString(10);
                        } else if (!property) {
                            value = '';
                        } else if (property === true) {
                            value = '1';
                        } else if (property === false) {
                            value = '0';
                        } else {
                            value = property.toString();
                        }
                    } else if (isMapDefinition(column)) {
                        value = column.map(model);
                    }
                    return this.checkCsvTextSafety(value);
                })
            )
        );

        const csvContentAsString: string = csvContent
            .map((line: string[]) => line.join(columnSeparator))
            .join(lineSeparator);
        const filetype = `text/csv;charset=${encoding}`;
        if (encoding === 'iso-8859-15') {
            this.exporter.saveFile(this.exporter.convertTo8859_15(csvContentAsString), filename, filetype);
        } else {
            this.exporter.saveFile(csvContentAsString, filename, filetype);
        }
    }

    /**
     * Ensures, that the given string has escaped double quotes
     * and no linebreak. The string itself will also be escaped by `double quotes`.
     *
     * @param {string} input any input to be sent to CSV
     * @returns {string} the cleaned string.
     */
    public checkCsvTextSafety(input: string): string {
        if (!input) {
            return '';
        }
        return '"' + input.replace(/"/g, '""').replace(/(\r\n\t|\n|\r\t)/gm, '') + '"';
    }

    /**
     * Capitalizes the first letter of a string
     *
     * @param input String that should be capitalized
     * @returns capitalized string
     */
    private capitalizeTranslate(input: string): string {
        const temp = input.charAt(0).toUpperCase() + input.slice(1);
        return this.translate.instant(temp);
    }

    public dummyCSVExport(header: string[], rows: (string | number | boolean | null)[][], filename: string): void {
        const separator = this.config.instant<string>('general_csv_separator');
        const headerRow = [header.map(item => this.translate.instant(item)).join(separator)];
        const content = rows.map(row =>
            row
                .map(item => {
                    let value = '';
                    if (!item) {
                        value = '';
                    }
                    if (typeof item === 'number') {
                        value = item.toString(10);
                    } else if (typeof item === 'boolean') {
                        value = item ? '1' : '0';
                    } else {
                        value = item;
                    }
                    return this.checkCsvTextSafety(value);
                })
                .join(separator)
        );
        const csvContentAsString = headerRow.concat(content).join('\r\n');
        const encoding = this.config.instant<'utf-8' | 'iso-8859-15'>('general_csv_encoding');
        if (encoding === 'iso-8859-15') {
            this.exporter.saveFile(this.exporter.convertTo8859_15(csvContentAsString), filename, 'text/csv');
        } else {
            this.exporter.saveFile(csvContentAsString, filename, 'text/csv');
        }
    }
}
