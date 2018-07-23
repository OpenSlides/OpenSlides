import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MotionListComponent } from './motion-list/motion-list.component';

const routes: Routes = [{ path: '', component: MotionListComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionsRoutingModule {}
