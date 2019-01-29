import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OperatorService } from './core/services/operator.service';
import { LoginDataService } from './core/services/login-data.service';
import { ConfigService } from './core/services/config.service';
import { ConstantsService } from './core/services/constants.service';
import { ServertimeService } from './core/services/servertime.service';
import { ThemeService } from './core/services/theme.service';

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
     * @param autoupdateService
     * @param notifyService
     * @param translate
     * @param themeService used to listen to theme-changes
     */
    public constructor(
        translate: TranslateService,
        operator: OperatorService,
        configService: ConfigService,
        loginDataService: LoginDataService,
        constantsService: ConstantsService, // Needs to be started, so it can register itself to the WebsocketService
        servertimeService: ServertimeService,
        themeService: ThemeService
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
}
