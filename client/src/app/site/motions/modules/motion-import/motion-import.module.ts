import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionImportListComponent } from './motion-import-list.component';
import { MotionImportRoutingModule } from './motion-import-routing.module';
import { SharedModule } from 'app/shared/shared.module';

@NgModule({
    declarations: [MotionImportListComponent],
    imports: [CommonModule, MotionImportRoutingModule, SharedModule]
})
export class MotionImportModule {}
