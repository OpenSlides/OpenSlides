import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { WatchForChangesGuard } from 'app/shared/utils/watch-for-changes.guard';
import { CallListComponent } from './call-list.component';

const routes: Route[] = [
    { path: '', component: CallListComponent, pathMatch: 'full', canDeactivate: [WatchForChangesGuard] }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CallListRoutingModule {}
