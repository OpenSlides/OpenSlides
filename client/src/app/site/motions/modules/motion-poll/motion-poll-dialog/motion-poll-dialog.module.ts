import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionPollDialogComponent } from './motion-poll-dialog.component';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [MotionPollDialogComponent],
    entryComponents: [MotionPollDialogComponent]
})
export class MotionPollDialogModule {}
