import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { ItemListSlideComponent } from './item-list-slide.component';

@NgModule(makeSlideModule(ItemListSlideComponent))
export class ItemListSlideModule {}
