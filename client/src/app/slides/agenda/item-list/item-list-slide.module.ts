import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { ItemListSlideComponent } from './item-list-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [ItemListSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: ItemListSlideComponent }]
})
export class ItemListSlideModule {}
