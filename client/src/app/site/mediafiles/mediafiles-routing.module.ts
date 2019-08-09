import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MediaUploadComponent } from './components/media-upload/media-upload.component';
import { MediafileListComponent } from './components/mediafile-list/mediafile-list.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'files',
        pathMatch: 'full'
    },
    {
        path: 'files',
        children: [{ path: '**', component: MediafileListComponent }],
        pathMatch: 'prefix'
    },
    {
        path: 'upload',
        data: { basePerm: 'mediafiles.can_manage' },
        children: [{ path: '**', component: MediaUploadComponent }],
        pathMatch: 'prefix'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MediafilesRoutingModule {}
