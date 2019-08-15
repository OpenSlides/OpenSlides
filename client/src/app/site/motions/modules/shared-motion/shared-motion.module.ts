import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionExportDialogComponent } from './motion-export-dialog/motion-export-dialog.component';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [MotionExportDialogComponent],
    entryComponents: [MotionExportDialogComponent]
})
export class SharedMotionModule {}
