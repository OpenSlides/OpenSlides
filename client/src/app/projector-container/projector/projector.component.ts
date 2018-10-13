import { Component, OnInit } from '@angular/core';
import { BaseComponent } from 'app/base.component';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'os-projector',
    templateUrl: './projector.component.html',
    styleUrls: ['./projector.component.css']
})
export class ProjectorComponent extends BaseComponent implements OnInit {
    public constructor(titleService: Title, translate: TranslateService) {
        super(titleService, translate);
    }

    public ngOnInit(): void {
        super.setTitle('Projector');
    }
}
