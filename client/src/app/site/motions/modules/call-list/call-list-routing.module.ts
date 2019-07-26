import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WatchSortingTreeGuard } from 'app/shared/utils/watch-sorting-tree.guard';
import { CallListComponent } from './call-list.component';

const routes: Routes = [
    { path: '', component: CallListComponent, pathMatch: 'full', canDeactivate: [WatchSortingTreeGuard] }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CallListRoutingModule {}
