import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';

import { SearchProperty } from 'app/core/ui-services/search.service';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { Searchable } from 'app/site/base/searchable';

@Component({
    selector: 'os-preview',
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewComponent implements OnDestroy {
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
     */
    public constructor(private cd: ChangeDetectorRef) {}

    /**
     * detach the change detection
     */
    public ngOnDestroy(): void {
        this.cd.detach();
    }
}
