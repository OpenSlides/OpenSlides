import { Injectable } from '@angular/core';
import { OpenSlidesComponent } from 'app/openslides.component';
import { PromptDialogComponent } from '../../shared/components/prompt-dialog/prompt-dialog.component';
import { MatDialog } from '@angular/material';

/**
 * A general service for prompting 'yes' or 'cancel' thinks from the user.
 */
@Injectable({
    providedIn: 'root'
})
export class PromptService extends OpenSlidesComponent {
    public constructor(private dialog: MatDialog) {
        super();
    }

    /**
     * Opens the dialog. Returns true, if the user accepts.
     * @param title The title to display in the dialog
     * @param content The content in the dialog
     */
    public async open(title: string, content: string): Promise<any> {
        const dialogRef = this.dialog.open(PromptDialogComponent, {
            width: '250px',
            data: { title: title, content: content }
        });

        return dialogRef.afterClosed().toPromise();
    }
}
