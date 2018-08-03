import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BaseComponent } from '../../../base.component';

@Component({
    selector: 'app-settings-list',
    templateUrl: './settings-list.component.html',
    styleUrls: ['./settings-list.component.css']
})
export class SettingsListComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    ngOnInit() {
        super.setTitle('Settings');
    }
}
