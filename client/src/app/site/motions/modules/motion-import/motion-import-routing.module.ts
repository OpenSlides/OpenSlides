import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { MotionImportListComponent } from './motion-import-list.component';

const routes: Route[] = [{ path: '', component: MotionImportListComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionImportRoutingModule {}
