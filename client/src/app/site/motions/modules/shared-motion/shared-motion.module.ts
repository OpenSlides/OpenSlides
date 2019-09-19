import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionExportDialogComponent } from './motion-export-dialog/motion-export-dialog.component';
import { MotionMultiselectActionsComponent } from './motion-multiselect-actions/motion-multiselect-actions.component';

@NgModule({
    imports: [CommonModule, SharedModule],
    exports: [MotionMultiselectActionsComponent],
    declarations: [MotionExportDialogComponent, MotionMultiselectActionsComponent],
    entryComponents: [MotionExportDialogComponent]
})
export class SharedMotionModule {}
