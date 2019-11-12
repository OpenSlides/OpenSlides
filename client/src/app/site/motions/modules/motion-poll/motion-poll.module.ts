import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionPollDetailComponent } from './motion-poll-detail/motion-poll-detail.component';
import { MotionPollDialogComponent } from './motion-poll-dialog/motion-poll-dialog.component';
import { MotionPollDialogModule } from './motion-poll-dialog/motion-poll-dialog.module';
import { MotionPollListComponent } from './motion-poll-list/motion-poll-list.component';
import { MotionPollRoutingModule } from './motion-poll-routing.module';

@NgModule({
    imports: [CommonModule, SharedModule, MotionPollRoutingModule, MotionPollDialogModule],
    declarations: [MotionPollDetailComponent, MotionPollListComponent],
    entryComponents: [MotionPollDialogComponent]
})
export class MotionPollModule {}
