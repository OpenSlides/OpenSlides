import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PollListComponent } from './components/poll-list/poll-list.component';

/**
 * Define the routes for the polls module
 */
const routes: Routes = [{ path: '', component: PollListComponent, pathMatch: 'full' }];

/**
 * Define the routing component and setup the routes
 */
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PollsRoutingModule {}
