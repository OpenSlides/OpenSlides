import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { PosterDetailComponent } from './components/poster-detail/poster-detail.component';
import { PosterListComponent } from './components/poster-list/poster-list.component';
import { PosterRoutingModule } from './posters-routing.module';

@NgModule({
    imports: [CommonModule, PosterRoutingModule, SharedModule],
    declarations: [PosterListComponent, PosterDetailComponent]
})
export class PostersModule {}
