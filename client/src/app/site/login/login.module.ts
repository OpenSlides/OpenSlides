import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './components/login-wrapper/login.component';
import { SharedModule } from '../../shared/shared.module';
import { LoginMaskComponent } from './components/login-mask/login-mask.component';
import { LoginInfoComponent } from './components/login-info/login-info.component';

@NgModule({
    imports: [CommonModule, RouterModule, SharedModule],
    declarations: [LoginComponent, LoginMaskComponent, LoginInfoComponent]
})
export class LoginModule {}
