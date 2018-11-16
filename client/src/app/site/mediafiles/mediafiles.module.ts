import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MediafilesRoutingModule } from './mediafiles-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { MediafileListComponent } from './components/mediafile-list/mediafile-list.component';
import { MediaUploadComponent } from './components/media-upload/media-upload.component';

@NgModule({
    imports: [CommonModule, MediafilesRoutingModule, SharedModule],
    declarations: [MediafileListComponent, MediaUploadComponent]
})
export class MediafilesModule {}
