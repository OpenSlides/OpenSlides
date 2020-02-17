import { ModuleWithProviders } from '@angular/compiler/src/core';
import { NgModule } from '@angular/core';
import { ROUTES } from '@angular/router';

import { allSlides } from './all-slides';
import { SlideManager } from './services/slide-manager.service';
import { SLIDE_MANIFESTS } from './slide-manifest';

/**
 * This module takes care about all slides and dynamic loading of them.
 *
 * We (ab)use the ng-router to make one chunk of each slide that can be
 * dynamically be loaded. The SlideManifest reassembles a router entry, by
 * given a `loadChildren`. During static analysis of the angular CLI, these modules are
 * found and put in sepearte chunks.
 */
@NgModule({
    providers: [SlideManager]
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
