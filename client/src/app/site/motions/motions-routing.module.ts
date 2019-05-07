import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        loadChildren: './modules/motion-list/motion-list.module#MotionListModule',
        pathMatch: 'full'
    },
    {
        path: 'import',
        loadChildren: './modules/motion-import/motion-import.module#MotionImportModule',
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'statute-paragraphs',
        loadChildren: './modules/statute-paragraph/statute-paragraph.module#StatuteParagraphModule',
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'comment-section',
        loadChildren: './modules/motion-comment-section/motion-comment-section.module#MotionCommentSectionModule',
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'call-list',
        loadChildren: './modules/call-list/call-list.module#CallListModule',
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'category',
        loadChildren: './modules/category/category.module#CategoryModule',
        data: { basePerm: 'motions.can_see' }
    },
    {
        path: 'blocks',
        loadChildren: './modules/motion-block/motion-block.module#MotionBlockModule',
        data: { basePerm: 'motions.can_see' }
    },
    {
        path: 'workflow',
        loadChildren: './modules/motion-workflow/motion-workflow.module#MotionWorkflowModule',
        data: { basePerm: 'motions.can_manage' }
    },
    {
        path: 'new',
        loadChildren: './modules/motion-detail/motion-detail.module#MotionDetailModule',
        data: { basePerm: 'motions.can_create' }
    },
    {
        path: ':id',
        loadChildren: './modules/motion-detail/motion-detail.module#MotionDetailModule',
        runGuardsAndResolvers: 'paramsChange',
        data: { basePerm: 'motions.can_see' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
