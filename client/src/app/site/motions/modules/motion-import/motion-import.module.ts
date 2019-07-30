import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionImportListComponent } from './motion-import-list.component';
import { MotionImportRoutingModule } from './motion-import-routing.module';

@NgModule({
    declarations: [MotionImportListComponent],
    imports: [CommonModule, MotionImportRoutingModule, SharedModule]
})
export class MotionImportModule {}
