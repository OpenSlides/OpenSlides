import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';

import { Observable, Subject } from 'rxjs';

import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { SuperSearchComponent } from 'app/site/common/components/super-search/super-search.component';

/**
 * Component to control the visibility of components, that overlay the whole window.
 * Like `global-spinner.component` and `super-search.component`.
 */
@Injectable({
    providedIn: 'root'
})
export class OverlayService {
    /**
     * Holds the reference to the search-dialog.
     * Necessary to prevent opening multiple dialogs at once.
     */
    private searchReference: MatDialogRef<SuperSearchComponent> = null;

    /**
     * Subject, that holds the visibility and message. The component can observe this.
     */
    private spinner: Subject<{ isVisible: boolean; text?: string }> = new Subject();

    /**
     * Boolean, whether appearing of the spinner should be prevented next time.
     */
    private preventAppearingSpinner = false;

    /**
     *
     * @param dialogService Injects the `MatDialog` to show the `super-search.component`
     */
    public constructor(private dialogService: MatDialog) {}

    /**
     * Function to change the visibility of the `global-spinner.component`.
     *
     * @param isVisible flag, if the spinner should be shown.
     * @param text optional. If the spinner should show a message.
     * @param preventAppearing optional. Wether to prevent showing the spinner the next time.
     */
    public setSpinner(isVisible: boolean, text?: string, forceAppearing?: boolean, preventAppearing?: boolean): void {
        if (!this.preventAppearingSpinner || forceAppearing) {
            setTimeout(() => this.spinner.next({ isVisible, text }));
        }
        this.preventAppearingSpinner = preventAppearing;
    }

    /**
     * Function to get the visibility as observable.
     *
     * @returns class member `visibility`.
     */
    public getSpinner(): Observable<{ isVisible: boolean; text?: string }> {
        return this.spinner;
    }

    /**
     * Sets the state of the `SuperSearchComponent`.
     *
     * @param isVisible If the component should be shown or not.
     */
    public showSearch(data?: any): void {
        if (!this.searchReference) {
            this.searchReference = this.dialogService.open(SuperSearchComponent, {
                ...largeDialogSettings,
                data: data ? data : null,
                disableClose: false,
                panelClass: 'super-search-container'
            });
            this.searchReference.afterClosed().subscribe(() => {
                this.searchReference = null;
            });
        }
    }

    /**
     * Function to reset the properties for the spinner.
     *
     * Necessary to get the initial state, if the user logs out
     * and still stays at the website.
     */
    public logout(): void {
        this.preventAppearingSpinner = false;
    }
}
