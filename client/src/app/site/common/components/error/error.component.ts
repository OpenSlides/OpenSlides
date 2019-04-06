import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * A component to show error states
 */
@Component({
    selector: 'os-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
    /**
     * Constructor
     *
     * @param route get paramters
     */
    public constructor(private route: ActivatedRoute) {}

    /**
     * Show the required debug output in the log
     */
    public ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params && params.error) {
                // print the error and the error message in terminal for debug purposes.
                // Will make it easier tell where user errors are
                console.error(`${params.error}! Required: "${params.msg}"`);
            }
        });
    }
}
