import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { OpenslidesService } from 'app/core/services/openslides.service';
import { AutoupdateService } from 'app/core/services/autoupdate.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    constructor(
        private openSlides: OpenslidesService,
        private autoupdate: AutoupdateService,
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

    ngOnInit() {
        this.openSlides.bootup();
    }
}
