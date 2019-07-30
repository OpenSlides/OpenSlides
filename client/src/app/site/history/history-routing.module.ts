import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HistoryListComponent } from './components/history-list/history-list.component';

/**
 * Define the routes for the history module
 */
const routes: Routes = [{ path: '', component: HistoryListComponent, pathMatch: 'full' }];

/**
 * Define the routing component and setup the routes
 */
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class HistoryRoutingModule {}
