import { Component, ApplicationRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { take, filter, auditTime } from 'rxjs/operators';

import { ConfigService } from './core/ui-services/config.service';
import { ConstantsService } from './core/core-services/constants.service';
import { CountUsersService } from './core/ui-services/count-users.service';
import { LoadFontService } from './core/ui-services/load-font.service';
import { LoginDataService } from './core/ui-services/login-data.service';
import { OperatorService } from './core/core-services/operator.service';
import { ServertimeService } from './core/core-services/servertime.service';
import { ThemeService } from './core/ui-services/theme.service';
import { DataStoreUpgradeService } from './core/core-services/data-store-upgrade.service';
import { PrioritizeService } from './core/core-services/prioritize.service';
import { PingService } from './core/core-services/ping.service';
import { SpinnerService } from './core/ui-services/spinner.service';
import { Router } from '@angular/router';
import { ViewUser } from './site/users/models/view-user';

/**
 * Angular's global App Component
 */
@Component({
    selector: 'os-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    /**
     * Member to hold the state of `stable`.
     */
    private isStable: boolean;

    /**
     * Member to hold the user.
     */
    private user: ViewUser;

    /**
     * Master-component of all apps.
     *
     * Inits the translation service, the operator, the login data and the constants.
     *
     * Handles the altering of Array.toString()
     *
     * @param translate To set the default language
     * @param operator To call the constructor of the OperatorService
     * @param loginDataService to call the constructor of the LoginDataService
     * @param constantService to call the constructor of the ConstantService
     * @param servertimeService executes the scheduler early on
     * @param themeService used to listen to theme-changes
     * @param countUsersService to call the constructor of the CountUserService
     * @param configService to call the constructor of the ConfigService
     * @param loadFontService to call the constructor of the LoadFontService
     * @param dataStoreUpgradeService
     */
    public constructor(
        translate: TranslateService,
        appRef: ApplicationRef,
        servertimeService: ServertimeService,
        router: Router,
        private operator: OperatorService,
        loginDataService: LoginDataService,
        constantsService: ConstantsService, // Needs to be started, so it can register itself to the WebsocketService
        themeService: ThemeService,
        private spinnerService: SpinnerService,
        countUsersService: CountUsersService, // Needed to register itself.
        configService: ConfigService,
        loadFontService: LoadFontService,
        dataStoreUpgradeService: DataStoreUpgradeService, // to start it.
        prioritizeService: PrioritizeService,
        pingService: PingService
    ) {
        // manually add the supported languages
        translate.addLangs(['en', 'de', 'cs']);
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');
        // get the browsers default language
        const browserLang = translate.getBrowserLang();
        // try to use the browser language if it is available. If not, uses english.
        translate.use(translate.getLangs().includes(browserLang) ? browserLang : 'en');
        // change default JS functions
        this.overloadArrayToString();
        // Show the spinner initial
        spinnerService.setVisibility(true, translate.instant('Loading data. Please wait...'));

        appRef.isStable
            .pipe(
                // take only the stable state
                filter(s => s),
                take(1)
            )
            .subscribe(() => servertimeService.startScheduler());

        // Subscribe to hide the spinner if the application has changed.
        appRef.isStable
            .pipe(
                filter(s => s),
                auditTime(1000)
            )
            .subscribe(stable => {
                // check the stable state only once.
                if (!this.isStable && stable) {
                    this.isStable = true;
                    this.checkConnectionProgress();
                }
            });
        // subscribe, to get the user.
        operator.getViewUserObservable().subscribe(user => {
            // check the user only once
            if ((!this.user && user) || operator.isAnonymous) {
                this.user = user;
                this.checkConnectionProgress();
                // if the user is logging out, remove this user.
            } else if (user === null) {
                this.user = user;
            }
        });
    }

    /**
     * Function to alter the normal Array.toString - function
     *
     * Will add a whitespace after a comma and shorten the output to
     * three strings.
     *
     * TODO: There might be a better place for overloading functions than app.component
     * TODO: Overloading can be extended to more functions.
     */
    private overloadArrayToString(): void {
        Array.prototype.toString = function(): string {
            let string = '';
            const iterations = Math.min(this.length, 3);

            for (let i = 0; i <= iterations; i++) {
                if (i < iterations) {
                    string += this[i];
                }

                if (i < iterations - 1) {
                    string += ', ';
                } else if (i === iterations && this.length > iterations) {
                    string += ', ...';
                }
            }
            return string;
        };
    }

    /**
     * Function to check if the user is existing and the app is already stable.
     * If both conditions true, hide the spinner.
     */
    private checkConnectionProgress(): void {
        if ((this.user || this.operator.isAnonymous) && this.isStable) {
            this.spinnerService.setVisibility(false);
        }
    }
}
