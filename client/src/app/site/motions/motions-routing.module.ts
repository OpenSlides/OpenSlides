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
        loadChildren: './modules/motion-import/motion-import.module#MotionImportModule'
    },
    {
        path: 'statute-paragraphs',
        loadChildren: './modules/statute-paragraph/statute-paragraph.module#StatuteParagraphModule'
    },
    {
        path: 'comment-section',
        loadChildren: './modules/motion-comment-section/motion-comment-section.module#MotionCommentSectionModule'
    },
    {
        path: 'call-list',
        loadChildren: './modules/call-list/call-list.module#CallListModule'
    },
    {
        path: 'category',
        loadChildren: './modules/category/category.module#CategoryModule'
    },
    {
        path: 'blocks',
        loadChildren: './modules/motion-block/motion-block.module#MotionBlockModule'
    },
    {
        path: 'workflow',
        loadChildren: './modules/motion-workflow/motion-workflow.module#MotionWorkflowModule'
    },
    {
        path: 'new',
        loadChildren: './modules/motion-detail/motion-detail.module#MotionDetailModule'
    },
    {
        path: ':id',
        loadChildren: './modules/motion-detail/motion-detail.module#MotionDetailModule'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
