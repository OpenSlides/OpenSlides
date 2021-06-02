import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { NgParticlesModule } from 'ng-particles';

import { ActionBarComponent } from './components/action-bar/action-bar.component';
import { ApplauseBarDisplayComponent } from './components/applause-bar-display/applause-bar-display.component';
import { ApplauseParticleDisplayComponent } from './components/applause-particle-display/applause-particle-display.component';
import { CallDialogComponent } from './components/call-dialog/call-dialog.component';
import { CallComponent } from './components/call/call.component';
import { InteractionContainerComponent } from './components/interaction-container/interaction-container.component';
import { SharedModule } from '../../shared/shared.module';
import { StreamComponent } from './components/stream/stream.component';

@NgModule({
    declarations: [
        ApplauseBarDisplayComponent,
        ApplauseParticleDisplayComponent,
        ActionBarComponent,
        InteractionContainerComponent,
        StreamComponent,
        CallComponent,
        CallDialogComponent
    ],
    imports: [CommonModule, SharedModule, NgParticlesModule],
    exports: [ActionBarComponent, InteractionContainerComponent]
})
export class InteractionModule {}
