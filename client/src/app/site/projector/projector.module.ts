import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectorRoutingModule } from './projector-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ProjectorListComponent } from './components/projector-list/projector-list.component';
import { ProjectorDetailComponent } from './components/projector-detail/projector-detail.component';
import { CountdownControlsComponent } from './components/countdown-controls/countdown-controls.component';
import { CountdownDialogComponent } from './components/countdown-dialog/countdown-dialog.component';
import { MessageControlsComponent } from './components/message-controls/message-controls.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';

@NgModule({
    imports: [CommonModule, ProjectorRoutingModule, SharedModule],
    declarations: [
        ProjectorListComponent,
        ProjectorDetailComponent,
        CountdownControlsComponent,
        CountdownDialogComponent,
        MessageControlsComponent,
        MessageDialogComponent
    ],
    entryComponents: [CountdownDialogComponent, MessageDialogComponent]
})
export class ProjectorModule {}
