import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionsRoutingModule } from './motions-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { MotionListComponent } from './motion-list/motion-list.component';
import { MotionDetailComponent } from './motion-detail/motion-detail.component';

@NgModule({
    imports: [CommonModule, MotionsRoutingModule, SharedModule],
    declarations: [MotionListComponent, MotionDetailComponent]
})
export class MotionsModule {}
