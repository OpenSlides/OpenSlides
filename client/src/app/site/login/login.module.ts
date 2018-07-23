import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [LoginComponent]
})
export class LoginModule {}
