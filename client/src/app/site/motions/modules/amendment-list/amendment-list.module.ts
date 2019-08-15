import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AmendmentListRoutingModule } from './amendment-list-routing.module';
import { AmendmentListComponent } from './amendment-list.component';
import { SharedModule } from 'app/shared/shared.module';
import { SharedMotionModule } from '../shared-motion/shared-motion.module';

@NgModule({
    declarations: [AmendmentListComponent],
    imports: [CommonModule, AmendmentListRoutingModule, SharedModule, SharedMotionModule]
})
export class AmendmentListModule {}
