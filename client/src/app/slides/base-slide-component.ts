import { Input } from '@angular/core';

import { SlideData } from 'app/core/core-services/projector-data.service';
import { ProjectorElement } from 'app/shared/models/core/projector';
import { ViewProjector } from 'app/site/projector/models/view-projector';

/**
 * Every slide has to extends this base class. It forces the slides
 * to have an input for the slidedata.
 */
export abstract class BaseSlideComponentDirective<T extends object, P extends ProjectorElement = ProjectorElement> {
    /**
     * Each slide must take slide data.
     */
    @Input()
    public data: SlideData<T, P>;

    /**
     * The projector where this slide is projected on.
     */
    @Input()
    public projector: ViewProjector;

    public constructor() {}
}
