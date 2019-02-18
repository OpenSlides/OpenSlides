import { Component, Input, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';

import { BaseComponent } from 'app/base.component';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { Size } from 'app/site/projector/size';
import { SlideData, ProjectorDataService } from 'app/site/projector/services/projector-data.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';

/**
 * THE projector. Cares about scaling and the right size and resolution.
 * Watches the given projector and creates slide-containers for each projectorelement.
 */
@Component({
    selector: 'os-projector',
    templateUrl: './projector.component.html',
    styleUrls: ['./projector.component.scss']
})
export class ProjectorComponent extends BaseComponent implements OnDestroy {
    /**
     * The current projector id.
     */
    private projectorId: number | null = null;

    /**
     * The projector. Accessors are below.
     */
    private _projector: ViewProjector;

    @Input()
    public set projector(projector: ViewProjector) {
        this._projector = projector;
        // check, if ID changed:
        const newId = projector ? projector.id : null;
        if (this.projectorId !== newId) {
            this.projectorIdChanged(this.projectorId, newId);
            this.projectorId = newId;
        }

        // Update scaling, if projector is set.
        if (projector) {
            const oldSize: Size = { ...this.currentProjectorSize };
            this.currentProjectorSize.height = projector.height;
            this.currentProjectorSize.width = projector.width;
            if (
                oldSize.height !== this.currentProjectorSize.height ||
                oldSize.width !== this.currentProjectorSize.width
            ) {
                this.updateScaling();
            }
        }
    }

    public get projector(): ViewProjector {
        return this._projector;
    }

    /**
     * The current projector size. This is for checking,
     * if the size actually has changed.
     */
    private currentProjectorSize: Size = { width: 0, height: 0 };

    /**
     * Ths subscription to the projectordata.
     */
    private dataSubscription: Subscription;

    /**
     * The container element. THis is neede to get the size of the element,
     * in which the projector must fit and be scaled to.
     */
    @ViewChild('container')
    private containerElement: ElementRef;

    /**
     * Dynamic style attributes for the projector.
     */
    public projectorStyle: {
        transform?: string;
        width: string;
        height: string;
        'background-color': string;
    } = {
        width: '0px',
        height: '0px',
        'background-color': 'white'
    };

    /**
     * Dynamic style attributes for the header and footer.
     */
    public headerFooterStyle: { 'background-color': string; color: string } = {
        'background-color': 'blue',
        color: 'white'
    };

    /**
     * Dynamic style attributes for the container.
     */
    public containerStyle: { height?: string } = {};

    /**
     * All slides to show on this projector
     */
    public slides: SlideData<object>[] = [];

    /**
     * The scroll for this projector. 0 is the default.
     */
    public scroll = 0;

    /**
     * The scale for this projector. 0 is the default.
     */
    public scale = 0;

    /**
     * The subscription to the projector.
     */
    private projectorSubscription: Subscription;

    /**
     * A subject that fires, if the container is resized.
     */
    public resizeSubject = new Subject<void>();

    // Some settings for the view from the config.
    public enableHeaderAndFooter = true;
    public enableTitle = true;
    public enableLogo = true;
    public eventName;
    public eventDescription;
    public eventDate;
    public eventLocation;

    /**
     * Listen to all related config variables. Register the resizeSubject.
     *
     * @param titleService
     * @param translate
     * @param projectorDataService
     * @param projectorRepository
     * @param configService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        private projectorDataService: ProjectorDataService,
        private projectorRepository: ProjectorRepositoryService,
        private configService: ConfigService
    ) {
        super(titleService, translate);

        // Get all important config variables.

        // enable header/footer
        this.configService
            .get<boolean>('projector_enable_header_footer')
            .subscribe(val => (this.enableHeaderAndFooter = val));
        this.configService.get<boolean>('projector_enable_title').subscribe(val => (this.enableTitle = val));

        // projector colors
        this.configService
            .get<string>('projector_header_fontcolor')
            .subscribe(val => (this.headerFooterStyle.color = val));
        this.configService
            .get<string>('projector_header_backgroundcolor')
            .subscribe(val => (this.headerFooterStyle['background-color'] = val));
        this.configService
            .get<string>('projector_background_color')
            .subscribe(val => (this.projectorStyle['background-color'] = val));

        // projector logo / background-image
        this.configService.get<boolean>('projector_enable_logo').subscribe(val => (this.enableLogo = val));
        this.configService.get<{ path?: string }>('logo_projector_header').subscribe(val => {
            if (val && val.path) {
                this.headerFooterStyle['background-image'] = "url('" + val.path + "')";
            }
        });

        // event data
        this.configService.get<string>('general_event_name').subscribe(val => (this.eventName = val));
        this.configService.get<string>('general_event_description').subscribe(val => (this.eventDescription = val));
        this.configService.get<string>('general_event_date').subscribe(val => (this.eventDate = val));
        this.configService.get<string>('general_event_location').subscribe(val => (this.eventLocation = val));

        // Watches for resizing of the container.
        this.resizeSubject.subscribe(() => {
            if (this.containerElement) {
                this.updateScaling();
            }
        });
    }

    /**
     * Scales the projector to the right format.
     */
    private updateScaling(): void {
        if (
            !this.containerElement ||
            this.currentProjectorSize.width === 0 ||
            this.containerElement.nativeElement.offsetWidth === 0
        ) {
            return;
        }
        const scale = this.containerElement.nativeElement.offsetWidth / this.currentProjectorSize.width;
        if (isNaN(scale)) {
            return;
        }
        this.projectorStyle.transform = 'scale(' + scale + ')';
        this.projectorStyle.width = this.currentProjectorSize.width + 'px';
        this.projectorStyle.height = this.currentProjectorSize.height + 'px';
        this.containerStyle.height = Math.round(scale * this.currentProjectorSize.height) + 'px';
    }

    /**
     * Called, if the projector id changes.
     */
    private projectorIdChanged(from: number, to: number): void {
        // Unsubscribe form data and projector subscriptions.
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
        if (this.projectorSubscription) {
            this.projectorSubscription.unsubscribe();
        }
        if (to > 0) {
            if (from > 0) {
                this.projectorDataService.projectorClosed(from);
            }

            this.dataSubscription = this.projectorDataService.getProjectorObservable(to).subscribe(data => {
                this.slides = data || [];
            });
            this.projectorSubscription = this.projectorRepository.getViewModelObservable(to).subscribe(projector => {
                if (projector) {
                    this.scroll = projector.scroll || 0;
                    this.scale = projector.scale || 0;
                }
            });
        } else if (!to && from > 0) {
            // no new projector
            this.projectorDataService.projectorClosed(from);
        }
    }

    /**
     * Deregister the projector from the projectordataservice.
     */
    public ngOnDestroy(): void {
        if (this.projectorId > 0) {
            this.projectorDataService.projectorClosed(this.projectorId);
        }
    }
}
