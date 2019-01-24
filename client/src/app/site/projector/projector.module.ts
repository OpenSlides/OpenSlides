import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectorRoutingModule } from './projector-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ProjectorComponent } from './components/projector/projector.component';
import { ProjectorListComponent } from './components/projector-list/projector-list.component';
import { ProjectorDetailComponent } from './components/projector-detail/projector-detail.component';
import { SlideContainerComponent } from './components/slide-container/slide-container.component';
import { FullscreenProjectorComponent } from './components/fullscreen-projector/fullscreen-projector.component';
import { ClockSlideService } from './services/clock-slide.service';
import { ProjectorRepositoryService } from './services/projector-repository.service';
import { ProjectorDataService } from './services/projector-data.service';

@NgModule({
    providers: [ClockSlideService, ProjectorDataService, ProjectorRepositoryService],
    imports: [CommonModule, ProjectorRoutingModule, SharedModule],
    declarations: [
        ProjectorComponent,
        ProjectorListComponent,
        ProjectorDetailComponent,
        SlideContainerComponent,
        FullscreenProjectorComponent
    ]
})
export class ProjectorModule {}
