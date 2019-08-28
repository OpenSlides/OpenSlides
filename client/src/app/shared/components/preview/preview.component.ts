import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { SearchProperty } from 'app/core/ui-services/search.service';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { Searchable } from 'app/site/base/searchable';

@Component({
    selector: 'os-preview',
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewComponent {
    /**
     * Sets the view-model, whose properties are displayed.
     *
     * @param model The view-model. Typeof `BaseViewModel & Searchable`.
     */
    @Input()
    public set viewModel(model: BaseViewModel & Searchable) {
        if (model) {
            this.model = model;
            const representation = model.formatForSearch();
            this.formattedSearchValue = representation.properties;
            this.modelType = representation.type;
            this.cd.detectChanges();
        }
    }

    /**
     * The view-model.
     */
    public model: BaseViewModel & Searchable;

    /**
     * An array of `SearchProperty`. This contains all key-value-pair attributes of the model.
     */
    public formattedSearchValue: SearchProperty[];

    /**
     * The type of the model. This is only set, if the model is from type 'mediafile'.
     */
    public modelType: string;

    /**
     * Default constructor
     *
     * @param sanitizer DomSanitizer
     */
    public constructor(private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {}

    /**
     * Function to sanitize any text to show html.
     *
     * @param text The text to sanitize.
     *
     * @returns {SafeHtml} The sanitized text as `HTML`.
     */
    public sanitize(text: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }
}
