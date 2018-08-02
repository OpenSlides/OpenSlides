import { NgModule } from '@angular/core';
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
    MatSnackBarModule
} from '@angular/material';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';

// FontAwesome modules
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

// ngx-translate
import { TranslateModule } from '@ngx-translate/core';

// directives
import { OsPermsDirective } from './directives/os-perms.directive';
import { DomChangeDirective } from './directives/dom-change.directive';
import { LegalnoticeDialogComponent } from './components/legal-notice/legal-notice.dialog.component';
import { PrivacyPolicyDialogComponent } from './components/privacy-policy/privacy-policy.dialog.component';

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
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatCardModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatSnackBarModule,
        MatDialogModule,
        FontAwesomeModule
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatCardModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        FontAwesomeModule,
        TranslateModule,
        OsPermsDirective
    ],
    declarations: [OsPermsDirective, DomChangeDirective, LegalnoticeDialogComponent, PrivacyPolicyDialogComponent],
    entryComponents: [LegalnoticeDialogComponent, PrivacyPolicyDialogComponent]
})
export class SharedModule {}
