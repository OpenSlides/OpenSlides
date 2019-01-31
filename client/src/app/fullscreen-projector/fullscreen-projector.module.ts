import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from 'app/shared/shared.module';
import { FullscreenProjectorComponent } from './fullscreen-projector/fullscreen-projector.component';
import { FullscreenProjectorRoutingModule } from './fullscreen-projector-routing.module';

@NgModule({
    imports: [CommonModule, FullscreenProjectorRoutingModule, SharedModule],
    declarations: [FullscreenProjectorComponent]
})
export class FullscreenProjectorModule {}
