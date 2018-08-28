import { Component, Injector, NgModuleRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AutoupdateService } from './core/services/autoupdate.service';
import { NotifyService } from './core/services/notify.service';
import { OperatorService } from './core/services/operator.service';
import { Subject } from 'rxjs';
import { AppModule } from './app.module';
import { OpenSlidesComponent } from './openslides.component';
import { OpenSlidesService } from './core/services/openslides.service';

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
     * This subject gets called, when the bootstrapping of the hole application is done.
     */
    private static bootstrapDoneSubject: Subject<NgModuleRef<AppModule>> = new Subject<NgModuleRef<AppModule>>();

    /**
     * This function should only be called, when the bootstrapping is done with a reference to
     * the bootstrapped module.
     * @param moduleRef Reference to the bootstrapped AppModule
     */
    public static bootstrapDone(moduleRef: NgModuleRef<AppModule>) {
        AppComponent.bootstrapDoneSubject.next(moduleRef);
    }

    /**
     * Initialises the translation unit.
     * @param autoupdateService
     * @param notifyService
     * @param translate
     */
    constructor(
        private autoupdateService: AutoupdateService,
        private notifyService: NotifyService,
        private translate: TranslateService,
        private operator: OperatorService,
        private OpenSlides: OpenSlidesService
    ) {
        // manually add the supported languages
        translate.addLangs(['en', 'de', 'fr']);
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');
        // get the browsers default language
        const browserLang = translate.getBrowserLang();
        // try to use the browser language if it is available. If not, uses english.
        translate.use(translate.getLangs().includes(browserLang) ? browserLang : 'en');

        AppComponent.bootstrapDoneSubject.asObservable().subscribe(this.setup.bind(this));
    }

    /**
     * Gets called, when bootstrapping is done. Gets the root injector, sets up the operator and starts OpenSlides.
     * @param moduleRef
     */
    private setup(moduleRef: NgModuleRef<AppModule>): void {
        OpenSlidesComponent.injector = moduleRef.injector;

        // Setup the operator after the root injector is known.
        this.operator.setupSubscription();

        this.OpenSlides.bootup(); // Yeah!
    }
}
