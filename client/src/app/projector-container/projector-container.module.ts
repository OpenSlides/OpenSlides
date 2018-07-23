import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectorContainerComponent } from './projector-container.component';
import { SharedModule } from 'app/shared/shared.module';
import { ProjectorComponent } from './projector/projector.component';
import { ProjectorContainerRoutingModule } from './projector/projector-container.routing.module';

@NgModule({
    imports: [CommonModule, ProjectorContainerRoutingModule, SharedModule],
    declarations: [ProjectorContainerComponent, ProjectorComponent]
})
export class ProjectorContainerModule {}
