import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { AssignmentSlideComponent } from './assignment-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [AssignmentSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: AssignmentSlideComponent }]
})
export class AssignmentSlideModule {}
