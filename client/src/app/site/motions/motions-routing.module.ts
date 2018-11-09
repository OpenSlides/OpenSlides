import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MotionListComponent } from './components/motion-list/motion-list.component';
import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { MotionCommentSectionListComponent } from './components/motion-comment-section-list/motion-comment-section-list.component';
import { StatuteParagraphListComponent } from './components/statute-paragraph-list/statute-paragraph-list.component';
import { SpeakerListComponent } from '../agenda/components/speaker-list/speaker-list.component';
import { CallListComponent } from './components/call-list/call-list.component';

const routes: Routes = [
    { path: '', component: MotionListComponent },
    { path: 'category', component: CategoryListComponent },
    { path: 'comment-section', component: MotionCommentSectionListComponent },
    { path: 'statute-paragraphs', component: StatuteParagraphListComponent },
    { path: 'call-list', component: CallListComponent },
    { path: 'new', component: MotionDetailComponent },
    { path: ':id', component: MotionDetailComponent },
    { path: ':id/speakers', component: SpeakerListComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
