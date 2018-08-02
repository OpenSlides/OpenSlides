import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-impressum',
    templateUrl: './legal-notice.dialog.component.html',
    styleUrls: ['./legal-notice.dialog.component.css']
})
export class LegalnoticeDialogComponent {
    constructor(public dialogRef: MatDialogRef<LegalnoticeDialogComponent>) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
