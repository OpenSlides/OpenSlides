import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionListRoutingModule } from './motion-list-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { MotionExportDialogComponent } from './components/motion-export-dialog/motion-export-dialog.component';
import { MotionListComponent } from './components/motion-list/motion-list.component';
import { perf } from 'perf';

@NgModule({
    imports: [CommonModule, MotionListRoutingModule, SharedModule],
    declarations: [MotionListComponent, MotionExportDialogComponent],
    entryComponents: [MotionExportDialogComponent]
})
export class MotionListModule {
    public constructor() {
        perf("Motion list module constructor", "Components");
    }
}
