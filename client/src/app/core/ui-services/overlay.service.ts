import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef, ProgressSpinnerMode } from '@angular/material';

import { Observable, Subject } from 'rxjs';

import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { SuperSearchComponent } from 'app/site/common/components/super-search/super-search.component';

/**
 * Optional configuration for the spinner.
 */
export interface SpinnerConfig {
    /**
     * The mode of the spinner. Defaults to `'indeterminate'`
     */
    mode?: ProgressSpinnerMode;
    /**
     * The diameter of the svg.
     */
    diameter?: number;
    /**
     * The width of the stroke of the spinner.
     */
    stroke?: number;
    /**
     * An optional value, if the spinner is in `'determinate'-mode`.
     */
    value?: number;
}

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
    private spinner: Subject<{ isVisible: boolean; text?: string; config?: SpinnerConfig }> = new Subject();

    /**
     * Boolean, whether appearing of the spinner should be prevented next time.
     */
    private preventAppearingSpinner: boolean;

    /**
     * Boolean to indicate, if the spinner has already appeared.
     */
    private spinnerHasAppeared = false;

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
    public setSpinner(isVisible: boolean, text?: string, preventAppearing?: boolean, config?: SpinnerConfig): void {
        if (!(this.preventAppearingSpinner && !this.spinnerHasAppeared && isVisible)) {
            setTimeout(() => this.spinner.next({ isVisible, text, config }));
            if (isVisible) {
                this.spinnerHasAppeared = true;
            }
        }
        this.preventAppearingSpinner = preventAppearing;
    }

    /**
     * Function to get the visibility as observable.
     *
     * @returns class member `visibility`.
     */
    public getSpinner(): Observable<{ isVisible: boolean; text?: string; config?: SpinnerConfig }> {
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
        this.spinnerHasAppeared = false;
        this.preventAppearingSpinner = false;
    }
}
