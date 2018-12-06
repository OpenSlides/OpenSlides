import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MotionListComponent } from './components/motion-list/motion-list.component';
import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { MotionCommentSectionListComponent } from './components/motion-comment-section-list/motion-comment-section-list.component';
import { StatuteParagraphListComponent } from './components/statute-paragraph-list/statute-paragraph-list.component';
import { SpeakerListComponent } from '../agenda/components/speaker-list/speaker-list.component';
import { CallListComponent } from './components/call-list/call-list.component';
import { AmendmentCreateWizardComponent } from './components/amendment-create-wizard/amendment-create-wizard.component';
import { MotionBlockListComponent } from './components/motion-block-list/motion-block-list.component';
import { MotionBlockDetailComponent } from './components/motion-block-detail/motion-block-detail.component';

const routes: Routes = [
    { path: '', component: MotionListComponent },
    { path: 'category', component: CategoryListComponent },
    { path: 'comment-section', component: MotionCommentSectionListComponent },
    { path: 'statute-paragraphs', component: StatuteParagraphListComponent },
    { path: 'call-list', component: CallListComponent },
    { path: 'blocks', component: MotionBlockListComponent },
    { path: 'blocks/:id', component: MotionBlockDetailComponent },
    { path: 'new', component: MotionDetailComponent },
    { path: ':id', component: MotionDetailComponent },
    { path: ':id/speakers', component: SpeakerListComponent },
    { path: ':id/create-amendment', component: AmendmentCreateWizardComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
