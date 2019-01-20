import { NgModule, NgModuleFactoryLoader, SystemJsNgModuleLoader } from '@angular/core';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { ROUTES } from '@angular/router';

import { DynamicSlideLoader } from './services/dynamic-slide-loader.service';
import { SLIDE_MANIFESTS } from './slide-manifest';
import { allSlides } from './all-slides';

/**
 * This module takes care about all slides and dynamic loading of them.
 *
 * We (ab)use the ng-router to make one chunk of each slide that can be
 * dynamically be loaded. The SlideManifest reassembles a router entry, by
 * given a `loadChildren`. During static analysis of the angular CLI, these modules are
 * found and put in sepearte chunks.
 */
@NgModule({
    providers: [DynamicSlideLoader, { provide: NgModuleFactoryLoader, useClass: SystemJsNgModuleLoader }]
})
export class SlidesModule {
    public static forRoot(): ModuleWithProviders {
        return {
            ngModule: SlidesModule,
            providers: [
                // provider for Angular CLI to analyze
                { provide: ROUTES, useValue: allSlides, multi: true },
                { provide: SLIDE_MANIFESTS, useValue: allSlides }
            ]
        };
    }
}
