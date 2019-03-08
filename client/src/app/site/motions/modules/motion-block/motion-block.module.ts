import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionBlockRoutingModule } from './motion-block-routing.module';
import { MotionBlockListComponent } from './components/motion-block-list/motion-block-list.component';
import { MotionBlockDetailComponent } from './components/motion-block-detail/motion-block-detail.component';
import { SharedModule } from 'app/shared/shared.module';

@NgModule({
    declarations: [MotionBlockListComponent, MotionBlockDetailComponent],
    imports: [CommonModule, MotionBlockRoutingModule, SharedModule]
})
export class MotionBlockModule {}
