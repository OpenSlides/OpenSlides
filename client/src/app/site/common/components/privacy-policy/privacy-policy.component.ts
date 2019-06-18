import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'os-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent implements OnInit {
    public constructor(private titleService: Title, private translate: TranslateService) {}

    public ngOnInit(): void {
        this.titleService.setTitle(this.translate.instant('Privacy policy'));
    }
}
