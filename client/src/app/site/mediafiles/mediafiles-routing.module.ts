import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MediafileListComponent } from './components/mediafile-list/mediafile-list.component';
import { MediaUploadComponent } from './components/media-upload/media-upload.component';

const routes: Routes = [
    { path: '', component: MediafileListComponent, pathMatch: 'full' },
    { path: 'upload', component: MediaUploadComponent, data: { basePerm: 'mediafiles.can_upload' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MediafilesRoutingModule {}
