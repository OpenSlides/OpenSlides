import { Component, OnInit, TemplateRef, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ErrorService, LogEntry } from 'app/core/ui-services/error.service';
import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';

@Component({
    selector: 'os-error-log',
    templateUrl: './error-log.component.html',
    styleUrls: ['./error-log.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ErrorLogComponent extends BaseViewComponent implements OnInit {
    public openedError: LogEntry;

    public get errorLog(): LogEntry[] {
        return this.errorService.errorLog;
    }

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        protected errorService: ErrorService,
        private dialog: MatDialog
    ) {
        super(title, translate, matSnackBar, errorService);
    }

    public ngOnInit(): void {}

    public onDownloadLog(): void {
        if (this.errorLog.length) {
            this.errorService.downloadLog();
        } else {
            const noLogMessage = this.translate.instant('No error log to download.');
            this.raiseMessage(noLogMessage);
        }
    }

    public onLogListEntry(dialog: TemplateRef<string>, log: LogEntry, index: number): void {
        this.openedError = log;
        console.log("log error ", Object.keys(log.error))
        const dialogRef = this.dialog.open(dialog, largeDialogSettings);
        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.errorService.deleteError(index);
            }
            this.openedError = undefined;
        });
    }

    public onClearLogButton(): void {
        this.errorService.clearErrorLog();
    }
}
