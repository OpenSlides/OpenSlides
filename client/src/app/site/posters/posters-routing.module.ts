import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
import { WatchForChangesGuard } from 'app/shared/utils/watch-for-changes.guard';
import { PosterDetailComponent } from './components/poster-detail/poster-detail.component';
import { PosterListComponent } from './components/poster-list/poster-list.component';

const routes: Routes = [
    { path: '', component: PosterListComponent, pathMatch: 'full' },
    {
        path: 'new',
        component: PosterDetailComponent,
        canDeactivate: [WatchForChangesGuard],
        data: { basePerm: Permission.postersCanManage }
    },
    {
        path: ':id',
        component: PosterDetailComponent,
        canDeactivate: [WatchForChangesGuard],
        data: { basePerm: Permission.postersCanSee }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PosterRoutingModule {}
