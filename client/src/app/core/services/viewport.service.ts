import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';

@Injectable({
    providedIn: 'root'
})
export class ViewportService {
    /**
     * True if Viewport equals mobile or small resolution.
     */
    private _isMobile = false;

    constructor(private breakpointObserver: BreakpointObserver) {}

    checkForChange() {
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

    get isMobile() {
        return this._isMobile;
    }
}
