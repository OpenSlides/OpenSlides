import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MotionCommentSectionListComponent } from './components/motion-comment-section-list/motion-comment-section-list.component';
import { MotionCommentSectionSortComponent } from './components/motion-comment-section-sort/motion-comment-section-sort.component';

const routes: Routes = [
    { path: '', component: MotionCommentSectionListComponent, pathMatch: 'full' },
    { path: 'sort', component: MotionCommentSectionSortComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionCommentSectionRoutingModule {}
