import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigListComponent } from './components/config-list/config-list.component';

const routes: Routes = [{ path: '', component: ConfigListComponent, pathMatch: 'full' }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConfigRoutingModule {}
