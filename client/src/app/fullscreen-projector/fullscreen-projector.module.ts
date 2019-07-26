import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { FullscreenProjectorRoutingModule } from './fullscreen-projector-routing.module';
import { FullscreenProjectorComponent } from './fullscreen-projector/fullscreen-projector.component';

@NgModule({
    imports: [CommonModule, FullscreenProjectorRoutingModule, SharedModule],
    declarations: [FullscreenProjectorComponent]
})
export class FullscreenProjectorModule {}
