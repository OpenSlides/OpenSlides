import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AutoupdateService } from './core/services/autoupdate.service';
import { NotifyService } from './core/services/notify.service';

/**
 * Angular's global App Component
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    /**
     * Initialises the operator, the auto update (and therefore a websocket) feature and the translation unit.
     * @param autoupdateService
     * @param notifyService
     * @param translate
     */
    constructor(
        private autoupdateService: AutoupdateService,
        private notifyService: NotifyService,
        private translate: TranslateService
    ) {
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
