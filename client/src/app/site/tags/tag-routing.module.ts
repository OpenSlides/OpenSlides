import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { TagListComponent } from './components/tag-list/tag-list.component';

const routes: Route[] = [{ path: '', component: TagListComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TagRoutingModule {}
