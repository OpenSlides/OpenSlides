import { ErrorHandler, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';

import { StorageService } from '../core-services/storage.service';
import { OpenSlidesError } from '../definitions/openslides-error';

/**
 * Shape of an entry of the error log
 */
export interface LogEntry {
    error: OpenSlidesError;
    date: Date;
    known?: boolean;
    explanation?: string;
}

/**
 * Service to treat, log, announce and handle errors
 * Should be used everywhere, where you expect to encounter errors
 * This includes: server errors, timeouts, PDF errors, Export errors [...]
 */
@Injectable({
    providedIn: 'root'
})
export class ErrorService extends ErrorHandler {
    /**
     * Store all errors
     */
    private _errorLog: LogEntry[] = [];

    /**
     * The key to find the error log in IndexedDB
     */
    private logStoreKey = 'errorLog_';

    /**
     * getter for the error log
     */
    public get errorLog(): LogEntry[] {
        return this._errorLog;
    }

    public constructor(
        private translate: TranslateService,
        private matSnackBar: MatSnackBar,
        private store: StorageService
    ) {
        super();
        this.restoreLog();
    }

    /**
     * Intercepts the error the browsers error handler.
     * Catches "console.error" and logs them accordingly
     * @param error
     */
    public handleError(error: Error): void {
        super.handleError(error);
        this.logError(new OpenSlidesError(error.message));
    }

    /**
     * Log and notify the error
     * @param error
     */
    public announceError(error: OpenSlidesError): void {
        this.logError(error);
        const notification = this.parseError(error);
        this.matSnackBar.open(notification, this.translate.instant('OK'), {
            duration: 0
        });
    }

    /**
     * Save the given error to the log
     * @param error
     */
    private logError(error: OpenSlidesError): void {
        const logEntry: LogEntry = {
            error: error,
            date: new Date(),
            known: false // TODO
        };

        this._errorLog.push(logEntry);

        console.log('whole log: ', this._errorLog);
        this.storeErrorLog();
    }

    /**
     * Creates a printable version of the error
     *
     * @param error
     * @returns String that represents the short summary of the error
     */
    private parseError(error: Error): string {
        const errorInfo: string[] = [];
        if (error.name) {
            errorInfo.push(`${this.translate.instant('Error')}: ${error.name}`);
        }
        if (error.message) {
            errorInfo.push(`${this.translate.instant(error.message)}`);
        }
        return errorInfo.join(' - ');
    }

    /**
     * Download the errorlog as JSON
     */
    public downloadLog(): void {
        const logText = JSON.stringify(
            this.errorLog.map(logEntry => {
                return {
                    error: logEntry.error.toString(),
                    date: logEntry.date.toISOString()
                };
            })
        );

        const logBlob = new Blob([logText]);
        saveAs(logBlob, `OpenSlides-Error-Log-${new Date().toISOString()}.json`);
    }

    /**
     * Deletes the error at the given index
     * @param errorIndex
     */
    public deleteError(errorIndex: number): void {
        this._errorLog.splice(errorIndex, 1);
        this.storeErrorLog();
    }

    /**
     * Clear the error log
     */
    public clearErrorLog(): void {
        this.store.remove(this.logStoreKey).then(() => {
            this._errorLog = [];
        });
    }

    private restoreLog(): void {
        this.store.get<LogEntry[]>(this.logStoreKey).then(log => {
            if (log && log.length) {
                console.log('error log, ', log);
                this._errorLog = log;
            }
        });
    }

    /**
     * Store the whole error log
     */
    private storeErrorLog(): void {
        this.store.set(this.logStoreKey, this._errorLog);
    }
}
