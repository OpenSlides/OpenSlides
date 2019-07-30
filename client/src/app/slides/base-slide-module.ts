import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/compiler/src/core';
import { Type } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { BaseSlideComponent } from './base-slide-component';
import { SLIDE } from './slide-token';

/**
 * Generates the configuration for a slide module.
 *
 * @param slideComponent The component
 * @return the Module configuration fo rthe slide module.
 */
export function makeSlideModule<T extends BaseSlideComponent<object>>(slideComponent: Type<T>): NgModule {
    return {
        imports: [CommonModule, SharedModule],
        declarations: [slideComponent],
        providers: [{ provide: SLIDE, useValue: slideComponent }],
        entryComponents: [slideComponent]
    };
}
