import { Directive, OnDestroy } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { BaseComponent } from '../../base.component';

/**
 * A base class for all views. Implements a generic error handling by raising a snack bar
 * with the error. The error is dismissed, if the component is destroyed, so if the
 * view is leaved.
 */
@Directive()
export abstract class BaseViewComponentDirective extends BaseComponent implements OnDestroy {
    /**
     * A reference to the current error snack bar.
     */
    private messageSnackBar: MatSnackBarRef<SimpleSnackBar>;

    /**
     * Subscriptions added to this list will be cleared 'on destroy'
     */
    protected subscriptions: Subscription[];

    /**
     * Constructor for base list views
     *
     * @param titleService the title serivce, passed to the base component
     * @param translate the translate service, passed to the base component
     * @param matSnackBar the snack bar service. Needed for showing errors.
     */
    public constructor(titleService: Title, translate: TranslateService, protected matSnackBar: MatSnackBar) {
        super(titleService, translate);
        this.subscriptions = [];
    }

    /**
     * automatically dismisses the error snack bar and clears subscriptions
     * if the component is destroyed.
     */
    public ngOnDestroy(): void {
        if (this.messageSnackBar) {
            this.messageSnackBar.dismiss();
        }

        this.cleanSubjects();
    }

    /**
     * Opens the snack bar with the given message.
     * This snack bar will only dismiss if the user clicks the 'OK'-button.
     */
    protected raiseWarning = (message: string): void => {
        this.messageSnackBar = this.matSnackBar.open(message, this.translate.instant('OK'));
    };

    /**
     * Opens an error snack bar with the given error message.
     * This is implemented as an arrow function to capture the called `this`. You can use this function
     * as callback (`.then(..., this.raiseError)`) instead of doing `this.raiseError.bind(this)`.
     *
     * @param message The message to show or an "real" error, which will be passed to the console.
     */
    protected raiseError = (message: string | Error): void => {
        let errorNotification: string;
        if (message instanceof Error) {
            if (message.message) {
                errorNotification = message.message;
            } else {
                errorNotification = this.translate.instant(
                    'A client error occurred. Please contact your system administrator.'
                );
            }
        } else {
            errorNotification = message;
        }
        this.messageSnackBar = this.matSnackBar.open(errorNotification, this.translate.instant('OK'), {
            duration: 0
        });
    };

    /**
     * Function to manually close the snack bar if it will not automatically close
     * or it should close in a previous step.
     */
    protected closeSnackBar(): void {
        if (this.matSnackBar) {
            this.matSnackBar.dismiss();
        }
    }

    /**
     * Manually clears all stored subscriptions.
     * Necessary for manual routing control, since the Angular
     * life cycle does not accept that navigation to the same URL
     * executes the life cycle again
     */
    protected cleanSubjects(): void {
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.subscriptions = [];
    }

    /**
     * Translate alternative  avoid endless loops during change detection
     * @param original the original string to translate
     */
    public translateSync(original: string): string {
        return this.translate.instant(original);
    }

    /**
     * To catch swipe gestures.
     * Should be overwritten by children which need swipe gestures
     */
    protected swipe(e: TouchEvent, when: string): void {}
}
