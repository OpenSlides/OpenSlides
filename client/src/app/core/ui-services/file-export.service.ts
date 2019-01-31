import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

@Injectable({
    providedIn: 'root'
})
export class FileExportService {
    /**
     * Constructor
     */
    public constructor() {}

    /**
     * Saves a file
     * @param file
     * @param filename
     */
    public saveFile(file: BlobPart, filename: string): void {
        const blob = new Blob([file]);
        saveAs(blob, filename, { autoBOM: true });
        // autoBOM = automatic byte-order-mark
    }

    /**
     * Validates a file name for characters that might break.
     * @param filename A name used to save a file
     */
    protected validateFileName(filename: string): boolean {
        // everything not containing \/?%*:|"<> and not ending on a dot
        const pattern = new RegExp(/^[^\\\/\?%\*:\|\"\<\>]*[^\.]+$/i);
        return pattern.test(filename);
    }
}
