import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { WatchForChangesGuard } from 'app/shared/utils/watch-for-changes.guard';
import { CategoriesSortComponent } from './components/categories-sort/categories-sort.component';
import { CategoryDetailComponent } from './components/category-detail/category-detail.component';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CategoryMotionsSortComponent } from './components/category-motions-sort/category-motions-sort.component';

const routes: Route[] = [
    { path: '', component: CategoryListComponent, pathMatch: 'full' },
    { path: ':id/sort', component: CategoryMotionsSortComponent, canDeactivate: [WatchForChangesGuard] },
    { path: 'sort', component: CategoriesSortComponent, canDeactivate: [WatchForChangesGuard] },
    { path: ':id', component: CategoryDetailComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CategoryRoutingModule {}
