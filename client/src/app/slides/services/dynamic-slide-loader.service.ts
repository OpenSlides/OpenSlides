import { Injectable, Inject, Injector, NgModuleFactoryLoader, ComponentFactory, Type } from '@angular/core';

import { SlideManifest, SlideOptions } from '../slide-manifest';
import { SLIDE } from '../slide-token';
import { SLIDE_MANIFESTS } from '../slide-manifest';
import { BaseSlideComponent } from '../base-slide-component';

/**
 * Cares about loading slides dynamically.
 */
@Injectable()
export class DynamicSlideLoader {
    public constructor(
        @Inject(SLIDE_MANIFESTS) private manifests: SlideManifest[],
        private loader: NgModuleFactoryLoader,
        private injector: Injector
    ) {}

    /**
     * Searches the manifest for the given slide name.
     *
     * TODO: Improve by loading all manifests in an object with the
     * slide name as keys in the constructor. It's just a lookup here, then.
     *
     * @param slideName The slide to look up.
     * @returns the slide's manifest.
     */
    private getManifest(slideName: string): SlideManifest {
        const manifest = this.manifests.find(m => m.slideName === slideName);

        if (!manifest) {
            throw new Error(`Could not find slide for "${slideName}"`);
        }
        return manifest;
    }

    /**
     * Get slide options for a given slide.
     *
     * @param slideName The slide
     * @returns SlideOptions for the requested slide.
     */
    public getSlideOptions(slideName: string): SlideOptions {
        return this.getManifest(slideName);
    }

    /**
     * Asynchronically load the slide's component factory, which is used to create
     * the slide component.
     *
     * @param slideName The slide to search.
     */
    public async getSlideFactory<T extends BaseSlideComponent<object>>(
        slideName: string
    ): Promise<ComponentFactory<T>> {
        const manifest = this.getManifest(slideName);

        // Load the module factory.
        return this.loader.load(manifest.loadChildren).then(ngModuleFactory => {
            // create the module
            const moduleRef = ngModuleFactory.create(this.injector);

            // Get the slide provided by the SLIDE-injectiontoken.
            let dynamicComponentType: Type<T>;
            try {
                // Read from the moduleRef injector and locate the dynamic component type
                dynamicComponentType = moduleRef.injector.get(SLIDE);
            } catch (e) {
                console.log(
                    'The module for Slide "' + slideName + '" is not configured right: Make usage of makeSlideModule.'
                );
                throw e;
            }
            // Resolve this component factory
            return moduleRef.componentFactoryResolver.resolveComponentFactory<T>(dynamicComponentType);
        });
    }
}
