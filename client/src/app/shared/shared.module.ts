import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// MaterialUI modules
import {
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatCardModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule
} from '@angular/material';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

// FontAwesome modules
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

// ngx-translate
import { TranslateModule } from '@ngx-translate/core';

// directives
import { PermsDirective } from './directives/perms.directive';
import { DomChangeDirective } from './directives/dom-change.directive';
import { HeadBarComponent } from './components/head-bar/head-bar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LegalNoticeContentComponent } from './components/legal-notice-content/legal-notice-content.component';
import { PrivacyPolicyContentComponent } from './components/privacy-policy-content/privacy-policy-content.component';
import { SearchValueSelectorComponent } from './components/search-value-selector/search-value-selector.component';

library.add(fas);

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
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatCardModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        FontAwesomeModule,
        TranslateModule.forChild(),
        RouterModule,
        NgxMatSelectSearchModule
    ],
    exports: [
        FormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatCardModule,
        MatInputModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule,
        MatTooltipModule,
        NgxMatSelectSearchModule,
        FontAwesomeModule,
        TranslateModule,
        PermsDirective,
        DomChangeDirective,
        FooterComponent,
        HeadBarComponent,
        SearchValueSelectorComponent,
        LegalNoticeContentComponent,
        PrivacyPolicyContentComponent
    ],
    declarations: [
        PermsDirective,
        DomChangeDirective,
        HeadBarComponent,
        FooterComponent,
        LegalNoticeContentComponent,
        PrivacyPolicyContentComponent,
        SearchValueSelectorComponent
    ]
})
export class SharedModule {}
