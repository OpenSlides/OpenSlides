import { NgModule } from '@angular/core';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'app/shared/shared.module';
import { AppModule } from 'app/app.module';
import { AppRoutingModule } from 'app/app-routing.module';
import { LoginModule } from 'app/site/login/login.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OpenSlidesTranslateModule } from 'app/core/translate/openslides-translate-module';

/**
 * Share Module for all "dumb" components and pipes.
 *
 * These components don not import and inject services from core or other features
 * in their constructors.
 *
 * Should receive all data though attributes in the template of the component using them.
 * No dependency to the rest of our application.
 */

@NgModule({
    imports: [
        AppModule,
        CommonModule,
        SharedModule,
        HttpClientModule,
        OpenSlidesTranslateModule.forRoot(),
        LoginModule,
        BrowserAnimationsModule,
        AppRoutingModule
    ],
    exports: [CommonModule, SharedModule, HttpClientModule, OpenSlidesTranslateModule, AppRoutingModule],
    providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
})
export class E2EImportsModule {}
