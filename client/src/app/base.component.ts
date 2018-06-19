import { Title } from '@angular/platform-browser';

//provides functions that might be used by a lot of components
export abstract class BaseComponent {
    private titleSuffix = ' - OpenSlides 3';

    constructor(protected titleService: Title) {}

    setTitle(prefix: string) {
        this.titleService.setTitle(prefix + this.titleSuffix);
    }
}
