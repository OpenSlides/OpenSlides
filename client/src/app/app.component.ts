import { Component, OnInit } from '@angular/core';
import { OpenslidesService } from './core/services/openslides.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    constructor(private openSlides: OpenslidesService) {}

    ngOnInit() {
        this.openSlides.bootup();
    }
}
