import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WatchSortingTreeGuard } from 'app/shared/utils/watch-sorting-tree.guard';
import { CategoriesSortComponent } from './components/categories-sort/categories-sort.component';
import { CategoryDetailComponent } from './components/category-detail/category-detail.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CategoryMotionsSortComponent } from './components/category-motions-sort/category-motions-sort.component';

const routes: Routes = [
    { path: '', component: CategoryListComponent, pathMatch: 'full' },
    { path: ':id/sort', component: CategoryMotionsSortComponent, canDeactivate: [WatchSortingTreeGuard] },
    { path: 'sort', component: CategoriesSortComponent, canDeactivate: [WatchSortingTreeGuard] },
    { path: ':id', component: CategoryDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CategoryRoutingModule {}
