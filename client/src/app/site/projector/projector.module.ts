import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectorRoutingModule } from './projector-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ProjectorListComponent } from './components/projector-list/projector-list.component';
import { ProjectorDetailComponent } from './components/projector-detail/projector-detail.component';
import { ClockSlideService } from './services/clock-slide.service';
import { ProjectorDataService } from './services/projector-data.service';
import { CurrentListOfSpeakersSlideService } from './services/current-list-of-of-speakers-slide.service';
import { CountdownListComponent } from './components/countdown-list/countdown-list.component';
import { ProjectorMessageListComponent } from './components/projector-message-list/projector-message-list.component';

@NgModule({
    providers: [ClockSlideService, ProjectorDataService, CurrentListOfSpeakersSlideService],
    imports: [CommonModule, ProjectorRoutingModule, SharedModule],
    declarations: [
        ProjectorListComponent,
        ProjectorDetailComponent,
        CountdownListComponent,
        ProjectorMessageListComponent
    ]
})
export class ProjectorModule {}
