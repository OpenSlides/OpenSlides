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
import { MotionPollDialogComponent } from '../motion-poll/motion-poll-dialog/motion-poll-dialog.component';
import { MotionPollDialogModule } from '../motion-poll/motion-poll-dialog/motion-poll-dialog.module';
import { MotionPollManagerComponent } from './components/motion-poll/motion-poll-manager/motion-poll-manager.component';
import { MotionPollPreviewComponent } from './components/motion-poll/motion-poll-preview/motion-poll-preview.component';
import { MotionPollComponent } from './components/motion-poll/motion-poll.component';
import { MotionTitleChangeRecommendationDialogComponent } from './components/motion-title-change-recommendation-dialog/motion-title-change-recommendation-dialog.component';
import { PersonalNoteComponent } from './components/personal-note/personal-note.component';

@NgModule({
    imports: [CommonModule, MotionDetailRoutingModule, SharedModule, MotionPollDialogModule],
    declarations: [
        MotionDetailComponent,
        AmendmentCreateWizardComponent,
        MotionCommentsComponent,
        PersonalNoteComponent,
        ManageSubmittersComponent,
        MotionPollComponent,
        MotionPollPreviewComponent,
        MotionDetailDiffComponent,
        MotionDetailOriginalChangeRecommendationsComponent,
        MotionChangeRecommendationDialogComponent,
        MotionTitleChangeRecommendationDialogComponent,
        MotionPollManagerComponent
    ],
    entryComponents: [
        MotionCommentsComponent,
        PersonalNoteComponent,
        ManageSubmittersComponent,
        MotionPollDialogComponent,
        MotionChangeRecommendationDialogComponent,
        MotionTitleChangeRecommendationDialogComponent
    ]
})
export class MotionDetailModule {}
