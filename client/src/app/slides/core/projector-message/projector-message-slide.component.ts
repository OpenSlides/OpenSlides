import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { ProjectorMessageSlideData } from './projector-message-slide-data';

@Component({
    selector: 'os-projector-message-slide',
    templateUrl: './projector-message-slide.component.html',
    styleUrls: ['./projector-message-slide.component.scss']
})
export class ProjectorMessageSlideComponent extends BaseSlideComponent<ProjectorMessageSlideData> {
    public constructor(private sanitizer: DomSanitizer) {
        super();
    }

    public trustHTML(html: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
