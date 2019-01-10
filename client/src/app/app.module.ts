// angular modules
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClient, HttpClientXsrfModule } from '@angular/common/http';
import { PapaParseModule } from 'ngx-papaparse';

// Elementary App Components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';

// translation module.
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PruningTranslationLoader } from './core/pruning-loader';
import { LoginModule } from './site/login/login.module';
import { AppLoadService } from './core/services/app-load.service';
import { ProjectorModule } from './site/projector/projector.module';
import { SlidesModule } from './slides/slides.module';

// PWA
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

/**
 * For the translation module. Loads a Custom 'translation loader' and provides it as loader.
 * @param http Just the HttpClient to load stuff
 */
export function HttpLoaderFactory(http: HttpClient): PruningTranslationLoader {
    return new PruningTranslationLoader(http);
}

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
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        AppRoutingModule,
        CoreModule,
        LoginModule,
        PapaParseModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        ProjectorModule,
        SlidesModule.forRoot()
    ],
    providers: [{ provide: APP_INITIALIZER, useFactory: AppLoaderFactory, deps: [AppLoadService], multi: true }],
    bootstrap: [AppComponent]
})
export class AppModule {}
