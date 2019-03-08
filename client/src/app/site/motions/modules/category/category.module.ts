import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoryRoutingModule } from './category-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CategorySortComponent } from './components/category-sort/category-sort.component';

@NgModule({
    declarations: [CategoryListComponent, CategorySortComponent],
    imports: [CommonModule, CategoryRoutingModule, SharedModule]
})
export class CategoryModule {}
