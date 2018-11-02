import { Component, Input } from '@angular/core';

import { BaseComponent } from '../../../../base.component';
import { ViewportService } from '../../../../core/services/viewport.service';

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

    @Input()
    public icon: string;

    public constructor(public vp: ViewportService) {
        super();
    }
}
