import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';
import { AmendmentCreateWizardComponent } from './components/amendment-create-wizard/amendment-create-wizard.component';

const routes: Routes = [
    { path: '', component: MotionDetailComponent, pathMatch: 'full' },
    { path: 'create-amendment', component: AmendmentCreateWizardComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionDetailRoutingModule {}
