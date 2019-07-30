import { Component, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

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
export class MetaTextBlockComponent extends BaseComponent {
    @Input()
    public showActionRow: boolean;

    public constructor(title: Title, translate: TranslateService, public vp: ViewportService) {
        super(title, translate);
    }
}
