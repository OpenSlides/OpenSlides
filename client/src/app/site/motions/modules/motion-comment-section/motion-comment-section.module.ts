import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionCommentSectionRoutingModule } from './motion-comment-section-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { MotionCommentSectionListComponent } from './components/motion-comment-section-list/motion-comment-section-list.component';
import { MotionCommentSectionSortComponent } from './components/motion-comment-section-sort/motion-comment-section-sort.component';

@NgModule({
    declarations: [MotionCommentSectionListComponent, MotionCommentSectionSortComponent],
    imports: [CommonModule, MotionCommentSectionRoutingModule, SharedModule]
})
export class MotionCommentSectionModule {}
