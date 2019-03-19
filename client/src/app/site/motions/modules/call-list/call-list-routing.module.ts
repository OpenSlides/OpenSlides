import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CallListComponent } from './call-list.component';
import { WatchSortingTreeGuard } from 'app/shared/utils/watch-sorting-tree.guard';

const routes: Routes = [
    { path: '', component: CallListComponent, pathMatch: 'full', canDeactivate: [WatchSortingTreeGuard] }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CallListRoutingModule {}
