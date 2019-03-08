import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CategorySortComponent } from './components/category-sort/category-sort.component';

const routes: Routes = [
    { path: '', component: CategoryListComponent, pathMatch: 'full' },
    { path: ':id', component: CategorySortComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CategoryRoutingModule {}
