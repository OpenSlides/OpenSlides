import { InjectionToken } from '@angular/core';
import { IdentifiableProjectorElement } from 'app/shared/models/core/projector';

/**
 * Slides can have these options.
 */
export interface SlideOptions {
    /**
     * Should this slide be scrollable?
     */
    scrollable: boolean;

    /**
     * Should this slide be scaleable?
     */
    scaleable: boolean;
}

/**
 * Is similar to router entries, so we can trick the router. Keep slideName and
 * path in sync.
 */
export interface SlideManifest extends SlideOptions {
    slide: string;
    path: string;
    loadChildren: string;
    verboseName: string;
    elementIdentifiers: (keyof IdentifiableProjectorElement)[];
    canBeMappedToModel: boolean;
}

export const SLIDE_MANIFESTS = new InjectionToken<SlideManifest[]>('SLIDE_MANIFEST');
