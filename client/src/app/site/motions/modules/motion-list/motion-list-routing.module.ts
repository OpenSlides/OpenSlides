import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { MotionListComponent } from './components/motion-list/motion-list.component';

const routes: Route[] = [{ path: '', component: MotionListComponent, pathMatch: 'full' }];
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionListRoutingModule {}
