import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

// Provides functionallity to set the webpage title
@Injectable({
    providedIn: 'root'
})
export class TitleService {
    private titleSuffix: string = " - OpenSlides 3";

    constructor(protected titleService: Title) { }

    setTitle(prefix: string) {
        this.titleService.setTitle(prefix + this.titleSuffix);
    }
}
