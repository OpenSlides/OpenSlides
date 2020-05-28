import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { SuperSearchComponent } from 'app/site/common/components/super-search/super-search.component';
import { DataStoreUpgradeService } from '../core-services/data-store-upgrade.service';
import { OfflineBroadcastService } from '../core-services/offline-broadcast.service';
import { OpenSlidesService } from '../core-services/openslides.service';
import { OperatorService } from '../core-services/operator.service';

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
     * Flag, that indicates, if the upgrade has checked.
     */
    private upgradeChecked = false;

    /**
     * The current user.
     */
    private user = null;

    /**
     * Flag, whether the app has booted.
     */
    private hasBooted = false;

    /**
     * Flag, whether the client is offline or not
     */
    private isOffline = false;

    /**
     *
     * @param dialogService Injects the `MatDialog` to show the `super-search.component`
     */
    public constructor(
        private dialogService: MatDialog,
        private operator: OperatorService,
        OpenSlides: OpenSlidesService,
        upgradeService: DataStoreUpgradeService,
        offlineBroadcastService: OfflineBroadcastService
    ) {
        // Subscribe to the current user.
        operator.getViewUserObservable().subscribe(user => {
            if (user) {
                this.user = user;
                this.checkConnection();
            }
        });
        // Subscribe to the booting-step.
        OpenSlides.booted.subscribe(isBooted => {
            this.hasBooted = isBooted;
            this.checkConnection();
        });
        // Subscribe to the upgrade-mechanism.
        upgradeService.upgradeChecked.subscribe(upgradeDone => {
            this.upgradeChecked = upgradeDone;
            this.checkConnection();
        });
        // Subscribe to check if we are offline
        offlineBroadcastService.isOfflineObservable.pipe(distinctUntilChanged()).subscribe(offline => {
            this.isOffline = offline;
            this.checkConnection();
        });
    }

    /**
     * Function to show the `global-spinner.component`.
     *
     * @param text optional. If the spinner should show a message.
     * @param forceAppearing optional. If the spinner must be shown.
     */
    public showSpinner(text?: string, forceAppearing?: boolean): void {
        if (!this.isConnectionStable() || forceAppearing) {
            setTimeout(() => this.spinner.next({ isVisible: true, text }));
        }
    }

    /**
     * Function to hide the `global-spinner.component`.
     */
    public hideSpinner(): void {
        setTimeout(() => this.spinner.next({ isVisible: false }));
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
     * Checks, if the connection is stable.
     * This relates to `appStable`, `booted` and `user || anonymous`.
     *
     * @returns True, if the three booleans are all true.
     */
    public isConnectionStable(): boolean {
        return (this.upgradeChecked || this.isOffline) && this.hasBooted && (!!this.user || this.operator.isAnonymous);
    }

    /**
     * Function to check, if the app is stable and, if true, hide the spinner.
     */
    private checkConnection(): void {
        if (this.isConnectionStable()) {
            this.hideSpinner();
        }
    }

    /**
     * Function to reset the properties for the spinner.
     *
     * Necessary to get the initial state, if the user logs out
     * and still stays at the website.
     */
    public logout(): void {
        this.hasBooted = false;
        this.user = null;
        this.upgradeChecked = false;
    }
}
