import { Input } from '@angular/core';

import { BaseSlideComponent } from './base-slide-component';

export function isBaseScaleScrollSlideComponent<T extends object>(obj: any): obj is IBaseScaleScrollSlideComponent<T> {
    return !!obj && obj.scroll !== undefined && obj.scale !== undefined;
}

/**
 * A description of BaseScaleScrollSlideComponent. Usefull for "multi"-inheritance.
 */
export interface IBaseScaleScrollSlideComponent<T extends object> extends BaseSlideComponent<T> {
    scroll: number;
    scale: number;
}

/**
 * A base slide component, which is autonomic with respect to scaling and srolling, meaning
 * that the slide itself (and not the slide container) will take care of this.
 */
export abstract class BaseScaleScrollSlideComponent<T extends object> extends BaseSlideComponent<T>
    implements IBaseScaleScrollSlideComponent<T> {
    @Input()
    public scroll: number;

    @Input()
    public scale: number;

    public constructor() {
        super();
    }
}
