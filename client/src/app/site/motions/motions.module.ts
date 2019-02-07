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
import { PersonalNoteComponent } from './components/personal-note/personal-note.component';
import { CallListComponent } from './components/call-list/call-list.component';
import { AmendmentCreateWizardComponent } from './components/amendment-create-wizard/amendment-create-wizard.component';
import { MotionBlockListComponent } from './components/motion-block-list/motion-block-list.component';
import { MotionBlockDetailComponent } from './components/motion-block-detail/motion-block-detail.component';
import { MotionImportListComponent } from './components/motion-import-list/motion-import-list.component';
import { ManageSubmittersComponent } from './components/manage-submitters/manage-submitters.component';
import { MotionPollComponent } from './components/motion-poll/motion-poll.component';
import { MotionPollDialogComponent } from './components/motion-poll/motion-poll-dialog.component';
import { MotionExportDialogComponent } from './components/motion-export-dialog/motion-export-dialog.component';
import { StatuteImportListComponent } from './components/statute-paragraph-list/statute-import-list/statute-import-list.component';
import { WorkflowListComponent } from './components/workflow-list/workflow-list.component';
import { WorkflowDetailComponent } from './components/workflow-detail/workflow-detail.component';

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
        PersonalNoteComponent,
        CallListComponent,
        AmendmentCreateWizardComponent,
        MotionBlockListComponent,
        MotionBlockDetailComponent,
        MotionImportListComponent,
        ManageSubmittersComponent,
        MotionPollComponent,
        MotionPollDialogComponent,
        MotionExportDialogComponent,
        StatuteImportListComponent,
        WorkflowListComponent,
        WorkflowDetailComponent
    ],
    entryComponents: [
        MotionChangeRecommendationComponent,
        StatuteParagraphListComponent,
        MotionCommentsComponent,
        MotionCommentSectionListComponent,
        PersonalNoteComponent,
        ManageSubmittersComponent,
        MotionPollDialogComponent,
        MotionExportDialogComponent
    ]
})
export class MotionsModule {}
