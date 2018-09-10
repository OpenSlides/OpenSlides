import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MotionListComponent } from './components/motion-list/motion-list.component';
import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';
import { CategoryListComponent } from './components/category-list/category-list.component';

const routes: Routes = [
    { path: '', component: MotionListComponent },
    { path: 'category', component: CategoryListComponent },
    { path: 'new', component: MotionDetailComponent },
    { path: ':id', component: MotionDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
