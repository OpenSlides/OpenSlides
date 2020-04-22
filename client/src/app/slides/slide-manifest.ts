import { InjectionToken } from '@angular/core';
import { LoadChildrenCallback } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorTitle } from 'app/core/core-services/projector.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { IdentifiableProjectorElement, ProjectorElement } from 'app/shared/models/core/projector';

type BooleanOrFunction = boolean | ((element: ProjectorElement) => boolean);

export interface Slide {
    slide: string;
}

/**
 * Slides can have these options.
 */
export interface SlideDynamicConfiguration {
    /**
     * Should this slide be scrollable?
     */
    scrollable: BooleanOrFunction;

    /**
     * Should this slide be scaleable?
     */
    scaleable: BooleanOrFunction;

    getSlideTitle?: (
        element: ProjectorElement,
        translate: TranslateService,
        viewModelStore: ViewModelStoreService
    ) => ProjectorTitle;
}

/**
 * Is similar to router entries, so we can trick the router. Keep slideName and
 * path in sync.
 */
export interface SlideManifest extends Slide {
    path: string;
    loadChildren: LoadChildrenCallback;
    verboseName: string;
    elementIdentifiers: (keyof IdentifiableProjectorElement)[];
    canBeMappedToModel: boolean;
}

export const SLIDE_MANIFESTS = new InjectionToken<SlideManifest[]>('SLIDE_MANIFEST');
