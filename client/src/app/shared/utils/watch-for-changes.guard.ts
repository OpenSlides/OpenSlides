import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

/**
 * Interface to describe the function that is necessary.
 */
export interface CanComponentDeactivate {
    canDeactivate: () => Promise<boolean>;
}

@Injectable({
    providedIn: 'root'
})
export class WatchForChangesGuard implements CanDeactivate<CanComponentDeactivate> {
    /**
     * Function to determine whether the route will change or not.
     *
     * @param component Is the component that implements the interface described above.
     *
     * @returns A boolean: True if the route should change, false if the route shouldn't change.
     */
    public async canDeactivate(component: CanComponentDeactivate): Promise<boolean> {
        return component.canDeactivate ? await component.canDeactivate() : true;
    }
}
