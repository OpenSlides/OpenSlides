import { Injectable } from '@angular/core';
import { OpenSlidesComponent } from '../../openslides.component';
import { MatDialog } from '@angular/material';
import {
    ChoiceDialogComponent,
    ChoiceDialogOptions,
    ChoiceAnswer
} from '../../shared/components/choice-dialog/choice-dialog.component';

/**
 * A service for prompting the user to select a choice.
 */
@Injectable({
    providedIn: 'root'
})
export class ChoiceService extends OpenSlidesComponent {
    /**
     * Ctor.
     *
     * @param dialog For opening the ChoiceDialog
     */
    public constructor(private dialog: MatDialog) {
        super();
    }

    /**
     * Opens the dialog. Returns the chosen value after the user accepts.
     * @param title The title to display in the dialog
     * @param choices The available choices
     * @returns an answer {@link ChoiceAnswer}
     */
    public async open(
        title: string,
        choices: ChoiceDialogOptions,
        multiSelect: boolean = false
    ): Promise<ChoiceAnswer> {
        const dialogRef = this.dialog.open(ChoiceDialogComponent, {
            minWidth: '250px',
            maxHeight:'90vh',
            data: { title: title, choices: choices, multiSelect: multiSelect }
        });
        return dialogRef.afterClosed().toPromise();
    }
}
