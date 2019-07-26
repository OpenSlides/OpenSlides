import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MediaUploadComponent } from './components/media-upload/media-upload.component';
import { MediafileListComponent } from './components/mediafile-list/mediafile-list.component';
import { MediafilesRoutingModule } from './mediafiles-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [CommonModule, MediafilesRoutingModule, SharedModule],
    declarations: [MediafileListComponent, MediaUploadComponent]
})
export class MediafilesModule {}
