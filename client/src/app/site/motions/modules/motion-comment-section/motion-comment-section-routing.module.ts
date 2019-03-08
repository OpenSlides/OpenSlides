import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MotionCommentSectionListComponent } from './motion-comment-section-list.component';

const routes: Routes = [{ path: '', component: MotionCommentSectionListComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionCommentSectionRoutingModule {}
