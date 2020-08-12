import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { FullscreenProjectorComponent } from './fullscreen-projector/fullscreen-projector.component';

const routes: Route[] = [
    {
        path: '',
        component: FullscreenProjectorComponent,
        pathMatch: 'full'
    },
    {
        path: ':id',
        component: FullscreenProjectorComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FullscreenProjectorRoutingModule {}
