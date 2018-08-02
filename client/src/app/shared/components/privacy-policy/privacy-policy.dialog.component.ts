import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-privacy-policy.dialog',
    templateUrl: './privacy-policy.dialog.component.html',
    styleUrls: ['./privacy-policy.dialog.component.css']
})
export class PrivacyPolicyDialogComponent {
    constructor(public dialogRef: MatDialogRef<PrivacyPolicyDialogComponent>) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
