import { ApplicationRef, Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { first, tap } from 'rxjs/operators';

import { ChatNotificationService } from './site/chat/services/chat-notification.service';
import { ConfigService } from './core/ui-services/config.service';
import { ConstantsService } from './core/core-services/constants.service';
import { CountUsersService } from './core/ui-services/count-users.service';
import { DataStoreUpgradeService } from './core/core-services/data-store-upgrade.service';
import { LoadFontService } from './core/ui-services/load-font.service';
import { LoginDataService } from './core/ui-services/login-data.service';
import { OfflineService } from './core/core-services/offline.service';
import { OpenSlidesStatusService } from './core/core-services/openslides-status.service';
import { OpenSlidesService } from './core/core-services/openslides.service';
import { OperatorService } from './core/core-services/operator.service';
import { OverlayService } from './core/ui-services/overlay.service';
import { RoutingStateService } from './core/ui-services/routing-state.service';
import { ServertimeService } from './core/core-services/servertime.service';
import { ThemeService } from './core/ui-services/theme.service';
import { VotingBannerService } from './core/ui-services/voting-banner.service';

declare global {
    /**
     * Enhance array with own functions
     * TODO: Remove once flatMap made its way into official JS/TS (ES 2019?)
     */
    interface Array<T> {
        flatMap(o: any): any[];
        intersect(a: T[]): T[];
        mapToObject(f: (item: T) => { [key: string]: any }): { [key: string]: any };
    }

    interface Set<T> {
        equals(other: Set<T>): boolean;
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
     * Most of the injected service are not used - this is ok. It is needed to definitly
     * run their constructors at app loading time
     */
    public constructor(
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        translate: TranslateService,
        appRef: ApplicationRef,
        servertimeService: ServertimeService,
        openslidesService: OpenSlidesService,
        openslidesStatus: OpenSlidesStatusService,
        router: Router,
        offlineService: OfflineService,
        operator: OperatorService,
        loginDataService: LoginDataService,
        constantsService: ConstantsService,
        themeService: ThemeService,
        overlayService: OverlayService,
        countUsersService: CountUsersService, // Needed to register itself.
        configService: ConfigService,
        loadFontService: LoadFontService,
        dataStoreUpgradeService: DataStoreUpgradeService, // to start it.
        routingState: RoutingStateService,
        votingBannerService: VotingBannerService, // needed for initialisation,
        chatNotificationService: ChatNotificationService
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
        this.overloadArrayFunctions();
        this.overloadSetFunctions();
        this.overloadModulo();
        this.loadCustomIcons();

        // Wait until the App reaches a stable state.
        // Required for the Service Worker.
        appRef.isStable
            .pipe(
                // take only the stable state
                first(stable => stable),
                tap(() => console.debug('App is now stable!'))
            )
            .subscribe(() => {
                openslidesStatus.setStable();
                servertimeService.startScheduler();
            });
    }

    private overloadArrayFunctions(): void {
        Object.defineProperty(Array.prototype, 'toString', {
            value: function (): string {
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
            },
            enumerable: false
        });

        Object.defineProperty(Array.prototype, 'flatMap', {
            value: function (o: any): any[] {
                const concatFunction = (x: any, y: any[]) => x.concat(y);
                const flatMapLogic = (f: any, xs: any) => xs.map(f).reduce(concatFunction, []);
                return flatMapLogic(o, this);
            },
            enumerable: false
        });

        Object.defineProperty(Array.prototype, 'intersect', {
            value: function <T>(other: T[]): T[] {
                let a = this;
                let b = other;
                // indexOf to loop over shorter
                if (b.length > a.length) {
                    [a, b] = [b, a];
                }
                return a.filter(e => b.indexOf(e) > -1);
            },
            enumerable: false
        });

        Object.defineProperty(Array.prototype, 'mapToObject', {
            value: function <T>(f: (item: T) => { [key: string]: any }): { [key: string]: any } {
                return this.reduce((aggr, item) => {
                    const res = f(item);
                    for (const key in res) {
                        if (res.hasOwnProperty(key)) {
                            aggr[key] = res[key];
                        }
                    }
                    return aggr;
                }, {});
            },
            enumerable: false
        });
    }

    /**
     * Adds some functions to Set.
     */
    private overloadSetFunctions(): void {
        Object.defineProperty(Set.prototype, 'equals', {
            value: function <T>(other: Set<T>): boolean {
                const difference = new Set(this);
                for (const elem of other) {
                    if (difference.has(elem)) {
                        difference.delete(elem);
                    } else {
                        return false;
                    }
                }
                return !difference.size;
            },
            enumerable: false
        });
    }

    /**
     * Enhances the number object with a real modulo operation (not remainder).
     * TODO: Remove this, if the remainder operation is changed to modulo.
     */
    private overloadModulo(): void {
        Object.defineProperty(Number.prototype, 'modulo', {
            value: function (n: number): number {
                return ((this % n) + n) % n;
            },
            enumerable: false
        });
    }

    private loadCustomIcons(): void {
        this.matIconRegistry.addSvgIcon(
            `clapping_hands`,
            this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/svg/clapping_hands.svg')
        );
    }
}
