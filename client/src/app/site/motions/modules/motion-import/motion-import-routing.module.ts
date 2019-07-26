import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MotionImportListComponent } from './motion-import-list.component';

const routes: Routes = [{ path: '', component: MotionImportListComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionImportRoutingModule {}
