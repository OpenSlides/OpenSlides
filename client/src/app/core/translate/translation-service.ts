import { Inject, Injectable } from '@angular/core';

import {
    MissingTranslationHandler,
    TranslateCompiler,
    TranslateLoader,
    TranslateParser,
    TranslateService,
    TranslateStore,
    USE_DEFAULT_LANG,
    USE_STORE
} from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

/**
 * Custom translate service. Wraps the get, stream and instant method not to throw an error, if null or undefined
 * is passed as keys to them. This happens, if yet not resolved properties should be translated in the templates.
 * Returns empty strings instead.
 */
@Injectable()
export class OpenSlidesTranslateService extends TranslateService {
    /**
     * See the ngx-translate TranslateService for docs.
     *
     * @param store
     * @param currentLoader
     * @param compiler
     * @param parser
     * @param missingTranslationHandler
     * @param useDefaultLang
     * @param isolate
     */
    public constructor(
        store: TranslateStore,
        currentLoader: TranslateLoader,
        compiler: TranslateCompiler,
        parser: TranslateParser,
        missingTranslationHandler: MissingTranslationHandler,
        @Inject(USE_DEFAULT_LANG) useDefaultLang: boolean = true,
        @Inject(USE_STORE) isolate: boolean = false
    ) {
        super(store, currentLoader, compiler, parser, missingTranslationHandler, useDefaultLang, isolate, true, 'en');
    }

    /**
     * Uses the original get function and returns an empty string instead of throwing an error.
     *
     * @override
     */
    public get(key: string | string[], interpolateParams?: Object): Observable<string | any> {
        try {
            return super.get(key, interpolateParams);
        } catch {
            return of('');
        }
    }

    /**
     * Uses the original key function and returns an empty string instead of throwing an error.
     *
     * @override
     */
    public stream(key: string | string[], interpolateParams?: Object): Observable<string | any> {
        try {
            return super.stream(key, interpolateParams);
        } catch {
            return of('');
        }
    }

    /**
     * Uses the original instant function and returns an empty string instead of throwing an error.
     *
     * @override
     */
    public instant(key: string | string[], interpolateParams?: Object): string | any {
        try {
            return super.instant(key, interpolateParams);
        } catch {
            return '';
        }
    }
}
