import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { TopicSlideData } from './topic-slide-data';

@Component({
    selector: 'os-topic-slide',
    templateUrl: './topic-slide.component.html',
    styleUrls: ['./topic-slide.component.scss']
})
export class TopicSlideComponent extends BaseSlideComponent<TopicSlideData> {
    public constructor(private sanitizer: DomSanitizer) {
        super();
    }

    /**
     * Function to sanitize text.
     * Necessary to render the text correctly.
     *
     * @param text which should be displayed.
     *
     * @returns safeHtml which can be displayed.
     */
    public sanitizedText(text: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }
}
