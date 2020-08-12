import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { AmendmentCreateWizardComponent } from './components/amendment-create-wizard/amendment-create-wizard.component';
import { MotionDetailComponent } from './components/motion-detail/motion-detail.component';

const routes: Route[] = [
    { path: '', component: MotionDetailComponent, pathMatch: 'full', runGuardsAndResolvers: 'paramsChange' },
    { path: 'create-amendment', component: AmendmentCreateWizardComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MotionDetailRoutingModule {}
