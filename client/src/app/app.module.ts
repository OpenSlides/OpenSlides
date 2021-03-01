import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

import { StorageModule } from '@ngx-pwa/local-storage';

import { AppLoadService } from './core/core-services/app-load.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { environment } from '../environments/environment';
import { ErrorService } from './core/core-services/error.service';
import { httpInterceptorProviders } from './core/core-services/http-interceptors';
import { LoginModule } from './site/login/login.module';
import { OpenSlidesTranslateModule } from './core/translate/openslides-translate-module';
import { SlidesModule } from './slides/slides.module';

/**
 * Returns a function that returns a promis that will be resolved, if all apps are loaded.
 * @param appLoadService The service that loads the apps.
 */
export function AppLoaderFactory(appLoadService: AppLoadService): () => Promise<void> {
    return () => appLoadService.loadApps();
}

/**
 * Global App Module. Keep it as clean as possible.
 */
@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'OpenSlidesCsrfToken',
            headerName: 'X-CSRFToken'
        }),
        BrowserAnimationsModule,
        OpenSlidesTranslateModule.forRoot(),
        AppRoutingModule,
        CoreModule,
        LoginModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        SlidesModule.forRoot(),
        StorageModule.forRoot({ IDBNoWrap: false })
    ],
    providers: [
        { provide: APP_INITIALIZER, useFactory: AppLoaderFactory, deps: [AppLoadService], multi: true },
        httpInterceptorProviders,
        { provide: ErrorHandler, useClass: ErrorService }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
