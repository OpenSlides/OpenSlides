import { NgModule } from '@angular/core';

import { makeSlideModule } from 'app/slides/base-slide-module';
import { UsersUserSlideComponent } from './users-user-slide.component';

@NgModule(makeSlideModule(UsersUserSlideComponent))
export class UsersUserSlideModule {}
