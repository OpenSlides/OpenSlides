import { BaseComponent } from '../../base.component';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { OnDestroy } from '@angular/core';

/**
 * A base class for all views. Implements a generic error handling by raising a snack bar
 * with the error. The error is dismissed, if the component is destroyed, so if the
 * view is leaved.
 */
export abstract class BaseViewComponent extends BaseComponent implements OnDestroy {
    /**
     * A reference to the current error snack bar.
     */
    private errorSnackBar: MatSnackBarRef<SimpleSnackBar>;

    /**
     * Constructor for bas elist views
     * @param titleService the title serivce, passed to the base component
     * @param translate the translate service, passed to the base component
     * @param matSnackBar the snack bar service. Needed for showing errors.
     */
    public constructor(titleService: Title, translate: TranslateService, private matSnackBar: MatSnackBar) {
        super(titleService, translate);
    }

    /**
     * Opens an error snack bar with the given error message.
     * This is implemented as an arrow function to capture the called `this`. You can use this function
     * as callback (`.then(..., this.raiseError)`) instead of doing `this.raiseError.bind(this)`.
     * @param message The message to show.
     */
    protected raiseError = (message: string): void => {
        this.errorSnackBar = this.matSnackBar.open(message, this.translate.instant('OK'), {
            duration: 0
        });
    };

    /**
     * automatically dismisses the error snack bar, if the component is destroyed.
     */
    public ngOnDestroy(): void {
        if (this.errorSnackBar) {
            this.errorSnackBar.dismiss();
        }
    }
}
