import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from '../../site/base/base-view-model';
import { FileExportService } from './file-export.service';
import { ConfigService } from './config.service';

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
    return 'property' in obj;
}

/**
 * Defines a csv column with a map function. Here, the user of this service can define hat should happen with
 * all the models. This map function is called for every model and the user should return a string that is
 * put into the csv. Also a column label must be given, that is capitalized and translated.
 */
interface CsvColumnDefinitionMap<T> {
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
    return 'map' in obj;
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
     *      columnseparator defaults to semicolon (other usual separators are ',' '\T' (tab), ' 'whitespace)
     */
    public export<T extends BaseViewModel>(
        models: T[],
        columns: CsvColumnsDefinition<T>,
        filename: string,
        {
            lineSeparator = '\r\n',
            columnSeparator = this.config.instant('general_csv_separator')
        }: {
            lineSeparator?: string;
            columnSeparator?: string;
        } = {}
    ): void {
        let csvContent = []; // Holds all lines as arrays with each column-value
        // initial array of usable text separators. The first character not used
        // in any text data or as column separator will be used as text separator
        let tsList = ['"', "'", '`', '/', '\\', ';', '.'];

        if (lineSeparator === columnSeparator) {
            throw new Error('lineseparator and columnseparator must differ from each other');
        }

        tsList = this.checkCsvTextSafety(lineSeparator, tsList);
        tsList = this.checkCsvTextSafety(columnSeparator, tsList);

        // create header data
        const header = columns.map(column => {
            let label: string;
            if (isPropertyDefinition(column)) {
                label = column.label ? column.label : (column.property as string);
            } else if (isMapDefinition(column)) {
                label = column.label;
            }
            label = this.capitalizeTranslate(label);
            tsList = this.checkCsvTextSafety(label, tsList);
            return label;
        });
        csvContent.push(header);

        // create lines
        csvContent = csvContent.concat(
            models.map(model => {
                return columns.map(column => {
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
                    tsList = this.checkCsvTextSafety(value, tsList);

                    return value;
                });
            })
        );

        // assemble lines, putting text separator in place
        if (!tsList.length) {
            throw new Error('no usable text separator left for valid csv text');
        }
        const csvContentAsString: string = csvContent
            .map(line => {
                return line.map(entry => tsList[0] + entry + tsList[0]).join(columnSeparator);
            })
            .join(lineSeparator);

        this.exporter.saveFile(csvContentAsString, filename);
    }

    /**
     * Checks if a given input contains any of the characters defined in a list
     * used for textseparators. The list is then returned without the 'special'
     * characters, as they may not be used as text separator in this csv.
     *
     * @param input any input to be sent to CSV
     * @param tsList The list of special characters to check.
     * @returns the cleaned CSV String list
     */
    public checkCsvTextSafety(input: string, tsList: string[]): string[] {
        if (input === null || input === undefined) {
            return tsList;
        }

        return tsList.filter(char => input.indexOf(char) < 0);
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
}
