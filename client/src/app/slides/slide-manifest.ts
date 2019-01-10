import { InjectionToken } from '@angular/core';

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
    slideName: string;
    path: string;
    loadChildren: string;
}

export const SLIDE_MANIFESTS = new InjectionToken<SlideManifest[]>('SLIDE_MANIFEST');
