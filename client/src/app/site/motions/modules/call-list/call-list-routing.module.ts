import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CallListComponent } from './call-list.component';

const routes: Routes = [{ path: '', component: CallListComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CallListRoutingModule {}
