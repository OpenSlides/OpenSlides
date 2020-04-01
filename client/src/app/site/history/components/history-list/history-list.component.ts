import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { HttpService } from 'app/core/core-services/http.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { TimeTravelService } from 'app/core/core-services/time-travel.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { isDetailNavigable } from 'app/shared/models/base/detail-navigable';
import { History } from 'app/shared/models/core/history';
import { Motion } from 'app/shared/models/motions/motion';
import { langToLocale } from 'app/shared/utils/lang-to-locale';
import { BaseViewComponent } from 'app/site/base/base-view';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewUser } from 'app/site/users/models/view-user';

/**
 * A list view for the history.
 *
 * Should display all changes that have been made in OpenSlides.
 */
@Component({
    selector: 'os-history-list',
    templateUrl: './history-list.component.html',
    styleUrls: ['./history-list.component.scss']
})
export class HistoryListComponent extends BaseViewComponent implements OnInit {
    /**
     * Subject determine when the custom timestamp subject changes
     */
    public customTimestampChanged: Subject<number> = new Subject<number>();

    public dataSource: MatTableDataSource<History> = new MatTableDataSource<History>();

    public pageSizes = [50, 100, 150, 200, 250];

    /**
     * The form for the selection of the model
     * When more models are supproted, add a "collection"-dropdown
     */
    public modelSelectForm: FormGroup;

    /**
     * The observer for the selected collection, which is currently hardcoded
     * to motions.
     */
    public collectionObserver: BehaviorSubject<BaseViewModel[]>;

    /**
     * The current selected collection. THis may move to `modelSelectForm`, if this can be choosen.
     */
    private currentCollection = Motion.COLLECTIONSTRING;

    public get currentModelId(): number | null {
        return this.modelSelectForm.controls.model.value;
    }

    /**
     * Constructor for the history list component
     *
     * @param titleService Setting the title
     * @param translate Handle translations
     * @param matSnackBar Showing errors and messages
     * @param repo The history repository
     * @param viewModelStore Access view models
     * @param router route to pages
     * @param operator checks if the user is a super admin
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private viewModelStore: ViewModelStoreService,
        private router: Router,
        private operator: OperatorService,
        private timeTravelService: TimeTravelService,
        private http: HttpService,
        private formBuilder: FormBuilder,
        private motionRepo: MotionRepositoryService,
        private promptService: PromptService,
        private activatedRoute: ActivatedRoute,
        private collectionMapper: CollectionStringMapperService
    ) {
        super(titleService, translate, matSnackBar);

        this.modelSelectForm = this.formBuilder.group({
            model: []
        });
        this.collectionObserver = this.motionRepo.getViewModelListBehaviorSubject();

        this.modelSelectForm.controls.model.valueChanges.subscribe((id: number) => {
            const elementId = `${this.currentCollection}:${id}`;
            this.queryByElementId(elementId);

            // Update the URL.
            this.router.navigate([], {
                relativeTo: this.activatedRoute,
                queryParams: { element: elementId },
                replaceUrl: true
            });
        });
    }

    /**
     * Init function for the history list.
     */
    public ngOnInit(): void {
        super.setTitle('History');

        this.dataSource.filterPredicate = (history: History, filter: string) => {
            filter = filter ? filter.toLowerCase() : '';

            if (!history) {
                return false;
            }

            const userfullname = this.getUserName(history);
            if (userfullname.toLowerCase().indexOf(filter) >= 0) {
                return true;
            }

            if (this.getElementInfo(history) && this.getElementInfo(history).toLowerCase().indexOf(filter) >= 0) {
                return true;
            }

            return this.parseInformation(history).toLowerCase().indexOf(filter) >= 0;
        };

        // If an element id is given, validate it and update the view.
        const params = this.activatedRoute.snapshot.queryParams;
        if (this.collectionMapper.isElementIdValid(params.element)) {
            this.queryByElementId(params.element);
            this.modelSelectForm.patchValue(
                {
                    model: parseInt(params.element.split(':')[1], 10)
                },
                { emitEvent: false }
            );
        }
    }

    /**
     * Returns the row definition for the table
     *
     * @returns an array of strings that contains the required row definition
     */
    public getRowDef(): string[] {
        return ['time', 'element', 'info', 'user'];
    }

    /**
     * Tries get the title of the BaseModel element corresponding to
     * a history object.
     *
     * @param history a history object
     * @returns the title of the history element or null if it could not be found
     */
    public getElementInfo(history: History): string {
        const model = this.viewModelStore.get(history.collectionString, history.modelId);
        return model ? model.getListTitle() : null;
    }

    /**
     * Click handler for rows in the history table.
     * Serves as an entry point for the time travel routine
     *
     * @param history Represents the selected element
     */
    public async onClickRow(history: History): Promise<void> {
        if (!this.operator.isSuperAdmin) {
            return;
        }

        await this.timeTravelService.loadHistoryPoint(history);
        const element = this.viewModelStore.get(history.collectionString, history.modelId);
        if (element && isDetailNavigable(element)) {
            this.router.navigate([element.getDetailStateURL()]);
        } else {
            const message = this.translate.instant('Cannot navigate to the selected history element.');
            this.raiseError(message);
        }
    }

    public getTimestamp(history: History): string {
        return history.getLocaleString(langToLocale(this.translate.currentLang));
    }

    /**
     * clears the whole history.
     */
    public async clearHistory(): Promise<void> {
        const title = this.translate.instant('Are you sure you want delete the whole history?');
        if (await this.promptService.open(title)) {
            try {
                await this.http.delete(`${environment.urlPrefix}/core/history/information/`);
                this.refresh();
            } catch (e) {
                this.raiseError(e);
            }
        }
    }

    public refresh(): void {
        if (this.currentCollection && this.currentModelId) {
            this.queryByElementId(`${this.currentCollection}:${this.currentModelId}`);
        }
    }

    /**
     * Returns a translated history information string which contains optional (translated) arguments.
     *
     * @param history the history
     */
    public parseInformation(history: History): string {
        if (!history.information || !history.information.length) {
            return '';
        }

        const baseString = this.translate.instant(history.information[0]);
        let argumentString;
        if (history.information.length > 1) {
            argumentString = this.translate.instant(history.information[1]);
        }
        return baseString.replace(/{arg1}/g, argumentString);
    }

    public getUserName(history: History): string {
        const user = this.viewModelStore.get(ViewUser, history.user_id);
        return user ? user.full_name : '';
    }

    /**
     * Handles the search fields' inputs
     *
     * @param value: a filter string. Matching is case-insensitive
     */
    public applySearch(value: string): void {
        this.dataSource.filter = value;
    }

    /**
     * Sets the data source to the requested element id.
     */
    private async queryByElementId(elementId: string): Promise<void> {
        try {
            const historyData = await this.http.get<History[]>(
                `${environment.urlPrefix}/core/history/information/`,
                null,
                {
                    type: 'element',
                    value: elementId
                }
            );
            this.dataSource.data = historyData.map(data => new History(data));
        } catch (e) {
            this.raiseError(e);
        }
    }
}
