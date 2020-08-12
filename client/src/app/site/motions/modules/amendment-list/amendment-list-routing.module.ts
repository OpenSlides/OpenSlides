import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { AmendmentListComponent } from './amendment-list.component';

const routes: Route[] = [
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
