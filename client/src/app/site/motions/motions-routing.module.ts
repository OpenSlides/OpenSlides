import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';

const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./modules/motion-list/motion-list.module').then(m => m.MotionListModule),
        pathMatch: 'full'
    },
    {
        path: 'import',
        loadChildren: () => import('./modules/motion-import/motion-import.module').then(m => m.MotionImportModule),
        data: { basePerm: Permission.motionsCanManage }
    },
    {
        path: 'statute-paragraphs',
        loadChildren: () =>
            import('./modules/statute-paragraph/statute-paragraph.module').then(m => m.StatuteParagraphModule),
        data: { basePerm: Permission.motionsCanManage }
    },
    {
        path: 'comment-section',
        loadChildren: () =>
            import('./modules/motion-comment-section/motion-comment-section.module').then(
                m => m.MotionCommentSectionModule
            ),
        data: { basePerm: Permission.motionsCanManage }
    },
    {
        path: 'call-list',
        loadChildren: () => import('./modules/call-list/call-list.module').then(m => m.CallListModule),
        data: { basePerm: Permission.motionsCanManage }
    },
    {
        path: 'category',
        loadChildren: () => import('./modules/category/category.module').then(m => m.CategoryModule),
        data: { basePerm: Permission.motionsCanSee }
    },
    {
        path: 'blocks',
        loadChildren: () => import('./modules/motion-block/motion-block.module').then(m => m.MotionBlockModule),
        data: { basePerm: Permission.motionsCanSee }
    },
    {
        path: 'workflow',
        loadChildren: () =>
            import('./modules/motion-workflow/motion-workflow.module').then(m => m.MotionWorkflowModule),
        data: { basePerm: Permission.motionsCanManage }
    },
    {
        path: 'new',
        loadChildren: () => import('./modules/motion-detail/motion-detail.module').then(m => m.MotionDetailModule),
        data: { basePerm: Permission.motionsCanCreate }
    },
    {
        path: 'new-amendment',
        loadChildren: () => import('./modules/motion-detail/motion-detail.module').then(m => m.MotionDetailModule),
        data: { basePerm: Permission.motionsCanCreateAmendments }
    },
    {
        path: 'amendments',
        loadChildren: () => import('./modules/amendment-list/amendment-list.module').then(m => m.AmendmentListModule),
        data: { basePerm: Permission.motionsCanSee }
    },
    {
        path: 'polls',
        loadChildren: () => import('./modules/motion-poll/motion-poll.module').then(m => m.MotionPollModule),
        data: { basePerm: Permission.motionsCanSee }
    },
    {
        path: ':id',
        loadChildren: () => import('./modules/motion-detail/motion-detail.module').then(m => m.MotionDetailModule),
        runGuardsAndResolvers: 'paramsChange',
        data: { basePerm: Permission.motionsCanSee }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
