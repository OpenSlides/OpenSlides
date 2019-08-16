import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AmendmentListComponent } from './amendment-list.component';

const routes: Routes = [
    {
        path: '',
        component: AmendmentListComponent,
        pathMatch: 'full'
    },
    { path: ':id', component: AmendmentListComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AmendmentListRoutingModule {}
