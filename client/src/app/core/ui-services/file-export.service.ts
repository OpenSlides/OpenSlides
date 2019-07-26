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
     * @param mimeType an optional mime type
     */
    public saveFile(file: BlobPart, filename: string, mimeType?: string): void {
        const options: BlobPropertyBag = {};
        if (mimeType) {
            options.type = mimeType;
        }
        const blob = new Blob([file], options);
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

    /**
     * get an iso-8859-15 - compatible blob part
     *
     * @param data
     * @returns a Blob part
     */
    public convertTo8859_15(data: string): BlobPart {
        const array = new Uint8Array(new ArrayBuffer(data.length));
        for (let i = 0; i < data.length; i++) {
            array[i] = data.charCodeAt(i);
        }
        return array;
    }
}
