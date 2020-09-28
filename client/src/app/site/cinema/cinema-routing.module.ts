import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CinemaComponent } from './components/cinema/cinema.component';

const routes: Routes = [{ path: '', component: CinemaComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CinemaRoutingModule {}
