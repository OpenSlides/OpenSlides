import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionDetailRoutingModule } from './motion-detail-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';
import { AmendmentCreateWizardComponent } from './components/amendment-create-wizard/amendment-create-wizard.component';
import { MotionCommentsComponent } from './components/motion-comments/motion-comments.component';
import { PersonalNoteComponent } from './components/personal-note/personal-note.component';
import { ManageSubmittersComponent } from './components/manage-submitters/manage-submitters.component';
import { MotionPollDialogComponent } from './components/motion-poll/motion-poll-dialog.component';
import { MotionPollComponent } from './components/motion-poll/motion-poll.component';
import { MotionDetailOriginalChangeRecommendationsComponent } from './components/motion-detail-original-change-recommendations/motion-detail-original-change-recommendations.component';
import { MotionDetailDiffComponent } from './components/motion-detail-diff/motion-detail-diff.component';
import { MotionChangeRecommendationComponent } from './components/motion-change-recommendation/motion-change-recommendation.component';
import { perf } from 'perf';

@NgModule({
    imports: [CommonModule, MotionDetailRoutingModule, SharedModule],
    declarations: [
        MotionDetailComponent,
        AmendmentCreateWizardComponent,
        MotionCommentsComponent,
        PersonalNoteComponent,
        ManageSubmittersComponent,
        MotionPollComponent,
        MotionPollDialogComponent,
        MotionDetailDiffComponent,
        MotionDetailOriginalChangeRecommendationsComponent,
        MotionChangeRecommendationComponent
    ],
    entryComponents: [
        MotionCommentsComponent,
        PersonalNoteComponent,
        ManageSubmittersComponent,
        MotionPollDialogComponent,
        MotionChangeRecommendationComponent
    ]
})
export class MotionDetailModule {
    public constructor() {
        perf("Motion detail module constructor");
    }
}
