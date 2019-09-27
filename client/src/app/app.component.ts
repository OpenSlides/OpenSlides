import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from './core/ui-services/config.service';
import { ConstantsService } from './core/core-services/constants.service';
import { CountUsersService } from './core/ui-services/count-users.service';
import { DataStoreUpgradeService } from './core/core-services/data-store-upgrade.service';
import { LoadFontService } from './core/ui-services/load-font.service';
import { LoginDataService } from './core/ui-services/login-data.service';
import { OperatorService } from './core/core-services/operator.service';
import { OverlayService } from './core/ui-services/overlay.service';
import { PingService } from './core/core-services/ping.service';
import { PrioritizeService } from './core/core-services/prioritize.service';
import { RoutingStateService } from './core/ui-services/routing-state.service';
import { ServertimeService } from './core/core-services/servertime.service';
import { ThemeService } from './core/ui-services/theme.service';

declare global {
    /**
     * Enhance array with own functions
     * TODO: Remove once flatMap made its way into official JS/TS (ES 2019?)
     */
    interface Array<T> {
        flatMap(o: any): any[];
    }

    /**
     * Enhances the number object to calculate real modulo operations.
     * (not remainder)
     */
    interface Number {
        modulo(n: number): number;
    }
}

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
        servertimeService: ServertimeService,
        router: Router,
        operator: OperatorService,
        loginDataService: LoginDataService,
        constantsService: ConstantsService, // Needs to be started, so it can register itself to the WebsocketService
        themeService: ThemeService,
        overlayService: OverlayService,
        countUsersService: CountUsersService, // Needed to register itself.
        configService: ConfigService,
        loadFontService: LoadFontService,
        dataStoreUpgradeService: DataStoreUpgradeService, // to start it.
        prioritizeService: PrioritizeService,
        pingService: PingService,
        routingState: RoutingStateService
    ) {
        // manually add the supported languages
        translate.addLangs(['en', 'de', 'cs', 'ru']);
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');
        // get the browsers default language
        const browserLang = translate.getBrowserLang();
        // try to use the browser language if it is available. If not, uses english.
        translate.use(translate.getLangs().includes(browserLang) ? browserLang : 'en');

        // change default JS functions
        this.overloadArrayToString();
        this.overloadFlatMap();
        this.overloadModulo();

        servertimeService.startScheduler();
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
     * Adds an implementation of flatMap.
     * TODO: Remove once flatMap made its way into official JS/TS (ES 2019?)
     */
    private overloadFlatMap(): void {
        const concat = (x: any, y: any) => x.concat(y);
        const flatMap = (f: any, xs: any) => xs.map(f).reduce(concat, []);
        Array.prototype.flatMap = function(f: any): any[] {
            return flatMap(f, this);
        };
    }

    /**
     * Enhances the number object with a real modulo operation (not remainder).
     * TODO: Remove this, if the remainder operation is changed to modulo.
     */
    private overloadModulo(): void {
        Number.prototype.modulo = function(n: number): number {
            return ((this % n) + n) % n;
        };
    }
}
