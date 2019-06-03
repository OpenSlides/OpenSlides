import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoryRoutingModule } from './category-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CategoryMotionsSortComponent } from './components/category-motions-sort/category-motions-sort.component';
import { CategoryDetailComponent } from './components/category-detail/category-detail.component';
import { CategoriesSortComponent } from './components/categories-sort/categories-sort.component';

@NgModule({
    declarations: [
        CategoryListComponent,
        CategoryDetailComponent,
        CategoryMotionsSortComponent,
        CategoriesSortComponent
    ],
    imports: [CommonModule, CategoryRoutingModule, SharedModule]
})
export class CategoryModule {}
