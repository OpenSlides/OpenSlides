import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionCommentSectionRoutingModule } from './motion-comment-section-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { MotionCommentSectionListComponent } from './motion-comment-section-list.component';

@NgModule({
    declarations: [MotionCommentSectionListComponent],
    imports: [CommonModule, MotionCommentSectionRoutingModule, SharedModule]
})
export class MotionCommentSectionModule {}
