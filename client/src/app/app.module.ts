// angular modules
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient, HttpClientXsrfModule } from '@angular/common/http';

// Elementary App Components
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';

// translation module.
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PruningTranslationLoader } from './core/pruning-loader';
import { LoginModule } from './site/login/login.module';

/**
 * For the translation module. Loads a Custom 'translation loader' and provides it as loader.
 * @param http Just the HttpClient to load stuff
 */
export function HttpLoaderFactory(http: HttpClient) {
    return new PruningTranslationLoader(http);
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
        LoginModule
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
