import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface PromptDialogData {
    title: string;
    content: string;
}

/**
 * A simple prompt dialog. Takes a title and content.
 */
@Component({
    selector: 'os-prompt-dialog',
    templateUrl: './prompt-dialog.component.html'
})
export class PromptDialogComponent {
    public constructor(
        public dialogRef: MatDialogRef<PromptDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PromptDialogData
    ) {}
}
