import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SlideToken } from 'app/slides/slide-token';
import { UserSlideComponent } from './user-slide.component';
@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [UserSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: UserSlideComponent }]
})
export class UserSlideModule {}
