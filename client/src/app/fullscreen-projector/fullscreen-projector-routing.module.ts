import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FullscreenProjectorComponent } from './fullscreen-projector/fullscreen-projector.component';

const routes: Routes = [
    {
        path: '',
        component: FullscreenProjectorComponent
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
