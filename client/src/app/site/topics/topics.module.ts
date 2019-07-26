import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { TopicDetailComponent } from './components/topic-detail/topic-detail.component';
import { TopicsRoutingModule } from './topics-routing.module';

/**
 * AppModule for the agenda and it's children.
 */
@NgModule({
    imports: [CommonModule, TopicsRoutingModule, SharedModule],
    declarations: [TopicDetailComponent]
})
export class TopicsModule {}
