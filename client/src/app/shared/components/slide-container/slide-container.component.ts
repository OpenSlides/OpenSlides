import { Component, Input, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from 'app/base.component';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { SlideData } from 'app/core/core-services/projector-data.service';
import { ProjectorElement } from 'app/shared/models/core/projector';
import { ViewProjector } from 'app/site/projector/models/view-projector';

function hasError(obj: object): obj is { error: string } {
    return (<{ error: string }>obj).error !== undefined;
}
/**
 * Container for one slide. Cares about the position (scale, scroll) in the projector,
 * and loading of slides.
 */
@Component({
    selector: 'os-slide-container',
    templateUrl: './slide-container.component.html',
    styleUrls: ['./slide-container.component.scss']
})
export class SlideContainerComponent extends BaseComponent {
    private previousSlideName: string;

    @ViewChild('slide', { read: ViewContainerRef })
    private slide: ViewContainerRef;
    private slideRef: ComponentRef<BaseSlideComponent<object>>;

    /**
     * The data for this slide. Will be accessed below.
     */
    private _slideData: SlideData<object>;

    @Input()
    public set slideData(slideData: SlideData<object>) {
        // If there is no ata or an error, clear and exit.
        if (!slideData || hasError(slideData) || (slideData.data && hasError(slideData.data))) {
            // clear slide container:
            if (this.slide) {
                this.slide.clear();
            }

            let error;
            if (hasError(slideData)) {
                error = slideData.error;
            } else if (slideData.data && hasError(slideData.data)) {
                error = slideData.data.error;
            }

            if (error) {
                console.log(error);
            }
            return;
        }

        this._slideData = slideData;
        if (this.previousSlideName !== slideData.element.name) {
            this.slideChanged(slideData.element);
            this.previousSlideName = slideData.element.name;
        }
        this.setDataForComponent();
    }

    public get slideData(): SlideData<object> {
        return this._slideData;
    }

    private _projector: ViewProjector;

    /**
     * Variable, if the projector header is enabled.
     */
    @Input()
    public set projector(projector: ViewProjector) {
        this._projector = projector;
        this.setProjectorForComponent();
    }

    public get projector(): ViewProjector {
        return this._projector;
    }

    /**
     * The current projector scroll.
     */
    private _scroll: number;

    /**
     * Updates the slideStyle, when the scroll changes.
     */
    @Input()
    public set scroll(value: number) {
        this._scroll = value;
        this.updateScroll();
    }

    public get scroll(): number {
        return this._scroll;
    }

    /**
     * Update the slideStyle, when the scale changes.
     */
    @Input()
    public set scale(value: number) {
        if (this.slideOptions.scaleable) {
            value *= 10;
            value += 100;
            this.slideStyle['font-size'] = `${value}%`;
        } else {
            this.slideStyle['font-size'] = '100%';
        }
    }

    /**
     * The current slideoptions.
     */
    public slideOptions: { scaleable: boolean; scrollable: boolean } = { scaleable: false, scrollable: false };

    /**
     * Styles for scaling and scrolling.
     */
    public slideStyle: { 'font-size': string; 'margin-top': string } = {
        'font-size': '100%',
        'margin-top': '50px'
    };

    public constructor(titleService: Title, translate: TranslateService, private slideManager: SlideManager) {
        super(titleService, translate);
    }

    /**
     * Updates the 'margin-top' attribute in the slide styles.
     */
    private updateScroll(): void {
        if (this.slideOptions.scrollable) {
            let value = this.scroll;
            value *= -50;
            if (this.projector.show_header_footer) {
                value += 50; // Default offset for the header
            }
            this.slideStyle['margin-top'] = `${value}px`;
        } else {
            this.slideStyle['margin-top'] = '0px';
        }
    }

    /**
     * Loads the slides via the SlideManager. Creates the slide components and provide the slide data to it.
     *
     * @param slideName The slide to load.
     */
    private slideChanged(element: ProjectorElement): void {
        const options = this.slideManager.getSlideConfiguration(element.name);
        if (typeof options.scaleable === 'boolean') {
            this.slideOptions.scaleable = options.scaleable;
        } else {
            this.slideOptions.scaleable = options.scaleable(element);
        }
        if (typeof options.scrollable === 'boolean') {
            this.slideOptions.scrollable = options.scrollable;
        } else {
            this.slideOptions.scrollable = options.scrollable(element);
        }
        this.slideManager.getSlideFactory(element.name).then(slideFactory => {
            this.slide.clear();
            this.slideRef = this.slide.createComponent(slideFactory);
            this.setDataForComponent();
            this.setProjectorForComponent();
        });
    }

    /**
     * "injects" the slide data into the slide component.
     */
    private setDataForComponent(): void {
        if (this.slideRef && this.slideRef.instance) {
            this.slideRef.instance.data = this.slideData;
        }
    }

    /**
     * "injects" the projector into the slide component.
     */
    private setProjectorForComponent(): void {
        if (this.slideRef && this.slideRef.instance) {
            this.slideRef.instance.projector = this.projector;
        }
    }
}
