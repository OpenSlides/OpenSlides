import { NgModule } from '@angular/core';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'app/shared/shared.module';
import { AppModule, HttpLoaderFactory } from 'app/app.module';
import { AppRoutingModule } from 'app/app-routing.module';
import { LoginModule } from 'app/site/login/login.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        LoginModule,
        BrowserAnimationsModule,
        AppRoutingModule
    ],
    exports: [CommonModule, SharedModule, HttpClientModule, TranslateModule, AppRoutingModule],
    providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
})
export class E2EImportsModule {}
