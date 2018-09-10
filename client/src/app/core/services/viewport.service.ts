import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';

/**
 * Viewport Service
 *
 * Uses breakpoint observers to determine the size of the users/operators viewport size (the device)
 *
 * ## Example:
 *
 * Provide the service via constructor and just use it like
 *
 * ```html
 * <div *ngIf="!vp.isMobile">Will only be shown of not mobile</div>
 * ```
 * or
 * ```ts
 * if (this.vp.isMobile) {
 *     ...
 * }
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class ViewportService {
    /**
     * True if Viewport equals mobile or small resolution.
     */
    private _isMobile = false;

    /**
     * Get the BreakpointObserver
     *
     * @param breakpointObserver
     */
    public constructor(private breakpointObserver: BreakpointObserver) {}

    /**
     * Needs to be called (exactly) once.
     * Will observe breakpoints and updates the _isMobile variable
     */
    public checkForChange(): void {
        this.breakpointObserver
            .observe([Breakpoints.Small, Breakpoints.HandsetPortrait])
            .subscribe((state: BreakpointState) => {
                if (state.matches) {
                    this._isMobile = true;
                } else {
                    this._isMobile = false;
                }
            });
    }

    public get isMobile(): boolean {
        return this._isMobile;
    }
}
