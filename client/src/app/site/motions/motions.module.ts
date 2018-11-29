import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionsRoutingModule } from './motions-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { MotionListComponent } from './components/motion-list/motion-list.component';
import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { MotionCommentSectionListComponent } from './components/motion-comment-section-list/motion-comment-section-list.component';
import { StatuteParagraphListComponent } from './components/statute-paragraph-list/statute-paragraph-list.component';
import { MotionChangeRecommendationComponent } from './components/motion-change-recommendation/motion-change-recommendation.component';
import { MotionDetailOriginalChangeRecommendationsComponent } from './components/motion-detail-original-change-recommendations/motion-detail-original-change-recommendations.component';
import { MotionDetailDiffComponent } from './components/motion-detail-diff/motion-detail-diff.component';
import { MotionCommentsComponent } from './components/motion-comments/motion-comments.component';
import { MetaTextBlockComponent } from './components/meta-text-block/meta-text-block.component';
import { PersonalNoteComponent } from './components/personal-note/personal-note.component';
import { CallListComponent } from './components/call-list/call-list.component';
import { AmendmentCreateWizardComponent } from './components/amendment-create-wizard/amendment-create-wizard.component';

@NgModule({
    imports: [CommonModule, MotionsRoutingModule, SharedModule],
    declarations: [
        MotionListComponent,
        MotionDetailComponent,
        CategoryListComponent,
        MotionCommentSectionListComponent,
        StatuteParagraphListComponent,
        MotionChangeRecommendationComponent,
        MotionDetailOriginalChangeRecommendationsComponent,
        MotionDetailDiffComponent,
        MotionCommentsComponent,
        MetaTextBlockComponent,
        PersonalNoteComponent,
        CallListComponent,
        AmendmentCreateWizardComponent
    ],
    entryComponents: [
        MotionChangeRecommendationComponent,
        StatuteParagraphListComponent,
        MotionCommentsComponent,
        MotionCommentSectionListComponent,
        MetaTextBlockComponent,
        PersonalNoteComponent
    ]
})
export class MotionsModule {}
