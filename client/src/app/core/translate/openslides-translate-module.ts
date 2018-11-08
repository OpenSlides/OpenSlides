import { ModuleWithProviders, NgModule } from '@angular/core';
import {
    TranslateModule,
    TranslateLoader,
    TranslateFakeCompiler,
    TranslateParser,
    TranslateCompiler,
    FakeMissingTranslationHandler,
    MissingTranslationHandler,
    TranslateStore,
    USE_STORE,
    USE_DEFAULT_LANG,
    TranslateService,
    TranslatePipe,
    TranslateDirective
} from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { OpenSlidesTranslateParser } from './translation-parser';
import { PruningTranslationLoader } from './translation-pruning-loader';
import { OpenSlidesTranslateService } from './translation-service';

/**
 * This is analog to the TranslateModule from ngx-translate, but with our own classes.
 */
@NgModule({
    imports: [TranslateModule],
    exports: [TranslatePipe, TranslateDirective]
})
export class OpenSlidesTranslateModule {
    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: TranslateModule,
            providers: [
                { provide: TranslateLoader, useClass: PruningTranslationLoader, deps: [HttpClient] },
                { provide: TranslateCompiler, useClass: TranslateFakeCompiler },
                { provide: TranslateParser, useClass: OpenSlidesTranslateParser },
                { provide: MissingTranslationHandler, useClass: FakeMissingTranslationHandler },
                TranslateStore,
                { provide: USE_STORE, useValue: false },
                { provide: USE_DEFAULT_LANG, useValue: true },
                { provide: TranslateService, useClass: OpenSlidesTranslateService }
            ]
        };
    }

    // no config store for child.
    public static forChild(): ModuleWithProviders {
        return {
            ngModule: TranslateModule,
            providers: [
                { provide: TranslateLoader, useClass: PruningTranslationLoader, deps: [HttpClient] },
                { provide: TranslateCompiler, useClass: TranslateFakeCompiler },
                { provide: TranslateParser, useClass: OpenSlidesTranslateParser },
                { provide: MissingTranslationHandler, useClass: FakeMissingTranslationHandler },
                { provide: USE_STORE, useValue: false },
                { provide: USE_DEFAULT_LANG, useValue: true },
                { provide: TranslateService, useClass: OpenSlidesTranslateService }
            ]
        };
    }
}
