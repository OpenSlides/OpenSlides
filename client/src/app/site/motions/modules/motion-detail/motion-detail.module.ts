import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AmendmentCreateWizardComponent } from './components/amendment-create-wizard/amendment-create-wizard.component';
import { SharedModule } from 'app/shared/shared.module';
import { ManageSubmittersComponent } from './components/manage-submitters/manage-submitters.component';
import { MotionChangeRecommendationDialogComponent } from './components/motion-change-recommendation-dialog/motion-change-recommendation-dialog.component';
import { MotionCommentsComponent } from './components/motion-comments/motion-comments.component';
import { MotionDetailDiffComponent } from './components/motion-detail-diff/motion-detail-diff.component';
import { MotionDetailOriginalChangeRecommendationsComponent } from './components/motion-detail-original-change-recommendations/motion-detail-original-change-recommendations.component';
import { MotionDetailRoutingModule } from './motion-detail-routing.module';
import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';
import { MotionPollModule } from '../motion-poll/motion-poll.module';
import { MotionTitleChangeRecommendationDialogComponent } from './components/motion-title-change-recommendation-dialog/motion-title-change-recommendation-dialog.component';
import { PersonalNoteComponent } from './components/personal-note/personal-note.component';

@NgModule({
    imports: [CommonModule, MotionDetailRoutingModule, SharedModule, MotionPollModule],
    declarations: [
        MotionDetailComponent,
        AmendmentCreateWizardComponent,
        MotionCommentsComponent,
        PersonalNoteComponent,
        ManageSubmittersComponent,
        MotionDetailDiffComponent,
        MotionDetailOriginalChangeRecommendationsComponent,
        MotionChangeRecommendationDialogComponent,
        MotionTitleChangeRecommendationDialogComponent
    ]
})
export class MotionDetailModule {}
