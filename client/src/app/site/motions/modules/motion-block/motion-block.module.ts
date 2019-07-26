import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionBlockDetailComponent } from './components/motion-block-detail/motion-block-detail.component';
import { MotionBlockListComponent } from './components/motion-block-list/motion-block-list.component';
import { MotionBlockRoutingModule } from './motion-block-routing.module';

@NgModule({
    declarations: [MotionBlockListComponent, MotionBlockDetailComponent],
    imports: [CommonModule, MotionBlockRoutingModule, SharedModule]
})
export class MotionBlockModule {}
