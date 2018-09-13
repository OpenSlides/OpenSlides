import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OperatorService } from './core/services/operator.service';
import { LoginDataService } from './core/services/login-data.service';
import { ConfigService } from './core/services/config.service';

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
     * Initialises the translation unit.
     * @param autoupdateService
     * @param notifyService
     * @param translate
     */
    public constructor(
        translate: TranslateService,
        operator: OperatorService,
        configService: ConfigService,
        loginDataService: LoginDataService
    ) {
        console.log('app ctor');
        // manually add the supported languages
        translate.addLangs(['en', 'de', 'fr']);
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');
        // get the browsers default language
        const browserLang = translate.getBrowserLang();
        // try to use the browser language if it is available. If not, uses english.
        translate.use(translate.getLangs().includes(browserLang) ? browserLang : 'en');
    }
}
