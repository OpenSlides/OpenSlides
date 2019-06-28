import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MediafileListComponent } from './components/mediafile-list/mediafile-list.component';
import { MediaUploadComponent } from './components/media-upload/media-upload.component';

const routes: Routes = [
    {
        path: 'files',
        children: [{ path: '**', component: MediafileListComponent }],
        pathMatch: 'prefix'
    },
    {
        path: 'upload',
        data: { basePerm: 'mediafiles.can_upload' },
        children: [{ path: '**', component: MediaUploadComponent }],
        pathMatch: 'prefix'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MediafilesRoutingModule {}
