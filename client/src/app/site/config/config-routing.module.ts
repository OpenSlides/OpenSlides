import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WatchForChangesGuard } from 'app/shared/utils/watch-for-changes.guard';
import { ConfigListComponent } from './components/config-list/config-list.component';
import { ConfigOverviewComponent } from './components/config-overview/config-overview.component';

const routes: Routes = [
    { path: '', component: ConfigOverviewComponent, pathMatch: 'full' },
    { path: ':group', component: ConfigListComponent, canDeactivate: [WatchForChangesGuard] }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ConfigRoutingModule {}
