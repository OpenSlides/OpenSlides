import { Component, OnInit } from '@angular/core';
import { OpenSlidesService } from './core/openslides.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    constructor(private openSlides: OpenSlidesService) { }

    ngOnInit() {
        this.openSlides.bootup();
    }
}
