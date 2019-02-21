import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { UserSlideComponent } from './user-slide.component';

@NgModule(makeSlideModule(UserSlideComponent))
export class UserSlideModule {}
