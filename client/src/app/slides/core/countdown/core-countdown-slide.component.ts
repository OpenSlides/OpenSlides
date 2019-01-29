import { Component, OnInit } from '@angular/core';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { CoreCountdownSlideData } from './core-countdown-slide-data';
import { HttpService } from 'app/core/services/http.service';

@Component({
    selector: 'os-core-countdown-slide',
    templateUrl: './core-countdown-slide.component.html',
    styleUrls: ['./core-countdown-slide.component.scss']
})
export class CoreCountdownSlideComponent extends BaseSlideComponent<CoreCountdownSlideData> implements OnInit {
    public constructor(private http: HttpService) {
        super();
        console.log(this.http);
    }

    public ngOnInit(): void {
        console.log('Hello from countdown slide');
    }
}
