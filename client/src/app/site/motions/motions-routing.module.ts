import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./modules/motion-list/motion-list.module').then(m => m.MotionListModule),
        pathMatch: 'full'
    },
    {
        path: 'import',
        loadChildren: () => import('./modules/motion-import/motion-import.module').then(m => m.MotionImportModule),
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'statute-paragraphs',
        loadChildren: () =>
            import('./modules/statute-paragraph/statute-paragraph.module').then(m => m.StatuteParagraphModule),
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'comment-section',
        loadChildren: () =>
            import('./modules/motion-comment-section/motion-comment-section.module').then(
                m => m.MotionCommentSectionModule
            ),
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'call-list',
        loadChildren: () => import('./modules/call-list/call-list.module').then(m => m.CallListModule),
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'category',
        loadChildren: () => import('./modules/category/category.module').then(m => m.CategoryModule),
        data: { basePerm: 'motions.can_see' }
    },
    {
        path: 'blocks',
        loadChildren: () => import('./modules/motion-block/motion-block.module').then(m => m.MotionBlockModule),
        data: { basePerm: 'motions.can_see' }
    },
    {
        path: 'workflow',
        loadChildren: () =>
            import('./modules/motion-workflow/motion-workflow.module').then(m => m.MotionWorkflowModule),
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'new',
        loadChildren: () => import('./modules/motion-detail/motion-detail.module').then(m => m.MotionDetailModule),
        data: { basePerm: 'motions.can_create' }
    },
    {
        path: ':id',
        loadChildren: () => import('./modules/motion-detail/motion-detail.module').then(m => m.MotionDetailModule),
        runGuardsAndResolvers: 'paramsChange',
        data: { basePerm: 'motions.can_see' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
