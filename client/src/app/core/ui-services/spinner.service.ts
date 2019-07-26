// External imports
import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

/**
 * Service for the `global-spinner.component`
 *
 * Handles the visibility of the global-spinner.
 */
@Injectable({
    providedIn: 'root'
})
export class SpinnerService {
    /**
     * Subject, that holds the visibility and message. The component can observe this.
     */
    private visibility: Subject<{ isVisible: boolean; text?: string }> = new Subject<{
        isVisible: boolean;
        text?: string;
    }>();

    /**
     * Function to change the visibility of the `global-spinner.component`.
     *
     * @param isVisible flag, if the spinner should be shown.
     * @param text optional. If the spinner should show a message.
     */
    public setVisibility(isVisible: boolean, text?: string): void {
        setTimeout(() => this.visibility.next({ isVisible, text }));
    }

    /**
     * Function to get the visibility as observable.
     *
     * @returns class member `visibility`.
     */
    public getVisibility(): Observable<{ isVisible: boolean; text?: string }> {
        return this.visibility;
    }
}
