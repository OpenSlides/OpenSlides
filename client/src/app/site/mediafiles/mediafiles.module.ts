import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MediafilesRoutingModule } from './mediafiles-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { MediafileListComponent } from './mediafile-list/mediafile-list.component';

@NgModule({
    imports: [CommonModule, MediafilesRoutingModule, SharedModule],
    declarations: [MediafileListComponent]
})
export class MediafilesModule {}
