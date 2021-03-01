import { ErrorHandler, Injectable } from '@angular/core';

import { OpenSlidesStatusService } from './openslides-status.service';

@Injectable({
    providedIn: 'root'
})
export class ErrorService extends ErrorHandler {
    // TODO: This service cannot be injected into other services since it is constructed twice.
    public constructor(private statusService: OpenSlidesStatusService) {
        super();
    }

    public handleError(error: any): void {
        const errorInformation = {
            error,
            name: this.guessName(error)
        };
        this.statusService.currentError.next(errorInformation);
        super.handleError(error);
    }

    private guessName(error: any): string | null {
        if (!error) {
            return;
        }

        if (error.rejection?.name) {
            return error.rejection.name;
        }

        if (error.name) {
            return error.name;
        }
    }
}
