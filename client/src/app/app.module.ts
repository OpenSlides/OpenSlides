// angular modules
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { PapaParseModule } from 'ngx-papaparse';

// Elementary App Components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { LoginModule } from './site/login/login.module';
import { AppLoadService } from './core/core-services/app-load.service';
import { SlidesModule } from './slides/slides.module';
import { OpenSlidesTranslateModule } from './core/translate/openslides-translate-module';

// PWA
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { GlobalSpinnerComponent } from './site/common/components/global-spinner/global-spinner.component';

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
    declarations: [AppComponent, GlobalSpinnerComponent],
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
        PapaParseModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        SlidesModule.forRoot()
    ],
    providers: [{ provide: APP_INITIALIZER, useFactory: AppLoaderFactory, deps: [AppLoadService], multi: true }],
    bootstrap: [AppComponent]
})
export class AppModule {}
