import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { HistoryListComponent } from './components/history-list/history-list.component';

/**
 * Define the routes for the history module
 */
const routes: Route[] = [{ path: '', component: HistoryListComponent, pathMatch: 'full' }];

/**
 * Define the routing component and setup the routes
 */
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HistoryRoutingModule {}
