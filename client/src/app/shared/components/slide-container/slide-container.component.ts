import { Component, Input, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from 'app/base.component';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { SlideOptions } from 'app/slides/slide-manifest';
import { ConfigService } from 'app/core/ui-services/config.service';
import { SlideData } from 'app/site/projector/services/projector-data.service';

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
    public set slideData(data: SlideData<object>) {
        // If there is no ata or an error, clear and exit.
        if (!data || data.error) {
            // clear slide container:
            if (this.slide) {
                this.slide.clear();
            }

            if (data.error) {
                console.error(data.error);
            }
            return;
        }

        this._slideData = data;
        if (this.previousSlideName !== data.element.name) {
            this.slideChanged(data.element.name);
            this.previousSlideName = data.element.name;
        }
        this.setDataForComponent();
    }

    public get slideData(): SlideData<object> {
        return this._slideData;
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
    private slideOptions: SlideOptions = { scaleable: false, scrollable: false };

    /**
     * Styles for scaling and scrolling.
     */
    public slideStyle: { 'font-size': string; 'margin-top': string } = {
        'font-size': '100%',
        'margin-top': '100px'
    };

    /**
     * Variable, if the projector header is enabled.
     */
    private headerEnabled = true;

    public constructor(
        titleService: Title,
        translate: TranslateService,
        private slideManager: SlideManager,
        private configService: ConfigService
    ) {
        super(titleService, translate);

        this.configService.get<boolean>('projector_enable_header_footer').subscribe(val => {
            this.headerEnabled = val;
        });
    }

    /**
     * Updates the 'margin-top' attribute in the slide styles.
     */
    private updateScroll(): void {
        if (this.slideOptions.scrollable) {
            let value = this._scroll;
            value *= -50;
            if (this.headerEnabled) {
                value += 100; // Default offset for the header
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
    private slideChanged(slideName: string): void {
        this.slideOptions = this.slideManager.getSlideOptions(slideName);
        this.slideManager.getSlideFactory(slideName).then(slideFactory => {
            this.slide.clear();
            this.slideRef = this.slide.createComponent(slideFactory);
            this.setDataForComponent();
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
}
