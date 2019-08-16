import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { MotionListRoutingModule } from './motion-list-routing.module';
import { MotionListComponent } from './components/motion-list/motion-list.component';
import { SharedMotionModule } from '../shared-motion/shared-motion.module';

@NgModule({
    imports: [CommonModule, MotionListRoutingModule, SharedModule, SharedMotionModule],
    declarations: [MotionListComponent]
})
export class MotionListModule {}
