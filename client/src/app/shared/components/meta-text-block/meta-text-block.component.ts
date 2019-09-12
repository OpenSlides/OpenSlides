import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';

import { ViewportService } from 'app/core/ui-services/viewport.service';
import { BaseComponent } from '../../../base.component';

/**
 * Component for the motion comments view
 */
@Component({
    selector: 'os-meta-text-block',
    templateUrl: './meta-text-block.component.html',
    styleUrls: ['./meta-text-block.component.scss']
})
export class MetaTextBlockComponent extends BaseComponent implements OnInit, OnDestroy {
    /**
     * Indicates, whether the action-row should be shown.
     */
    @Input()
    public showActionRow: boolean;

    /**
     * Indicates, whether the content should be expandable or always expanded.
     *
     * If `true`, it resets the flag `isExpanded`. This prevents an error -
     * when the given element is expanded and the control was disabled, the
     * subscription is deleted.
     */
    @Input()
    public set disableExpandControl(disableControl: boolean) {
        this._disableExpandControl = disableControl;
        if (disableControl) {
            this.isExpanded = false;
            this.cd.detectChanges();
        }
    }

    /**
     * Returns the flag `disableExpandControl`.
     */
    public get disableExpandControl(): boolean {
        return this._disableExpandControl;
    }

    /**
     * Boolean, whether the control to expand the element should be disabled or not.
     */
    private _disableExpandControl = false;

    /**
     * Boolean to see, if the content can be expanded.
     */
    public canExpand = false;

    /**
     * Boolean to see, if the content is currently expanded.
     */
    public isExpanded = false;

    /**
     * Subject to listen, whether the height of the given dom-element has changed.
     */
    public resizeSubject = new Subject<number>();

    /**
     * Subscription to resize-change-events for the height of the content.
     */
    private contentSubscription: Subscription;

    /**
     * Default constructor.
     *
     * @param title
     * @param translate
     * @param vp
     * @param cd
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        public vp: ViewportService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate);
    }

    /**
     * Sets the subscription.
     */
    public ngOnInit(): void {
        this.contentSubscription = this.resizeSubject.subscribe(newHeight => this.resizesContentBox(newHeight));
    }

    /**
     * Deletes and unsubscribes to subscription.
     */
    public ngOnDestroy(): void {
        if (this.contentSubscription) {
            this.contentSubscription.unsubscribe();
            this.contentSubscription = null;
        }
        this.cd.detach();
    }

    /**
     * Function to check, if the new height of the element
     * is greater than the limit of `200px`.
     *
     * @param height The new height as `number` of the linked element.
     */
    private resizesContentBox(height: number): void {
        this.canExpand = height > 200;
    }
}
