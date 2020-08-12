import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { CinemaComponent } from './components/cinema/cinema.component';

const routes: Route[] = [{ path: '', component: CinemaComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CinemaRoutingModule {}
