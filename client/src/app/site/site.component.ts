import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';

import { AuthService } from 'app/core/services/auth.service';
import { AutoupdateService } from 'app/core/services/autoupdate.service';
import { OperatorService } from 'app/core/services/operator.service';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core'; //showcase
import { BaseComponent } from 'app/base.component';

@Component({
    selector: 'app-site',
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.css']
})
export class SiteComponent extends BaseComponent implements OnInit {
    username = this.operator.username;
    isMobile = false;

    constructor(
        private authService: AuthService,
        private autoupdateService: AutoupdateService,
        private operator: OperatorService,
        private router: Router,
        private breakpointObserver: BreakpointObserver,
        private translate: TranslateService
    ) {
        super();
    }

    ngOnInit() {
        this.breakpointObserver
            .observe([Breakpoints.Small, Breakpoints.HandsetPortrait])
            .subscribe((state: BreakpointState) => {
                if (state.matches) {
                    this.isMobile = true;
                } else {
                    this.isMobile = false;
                }
            });

        //get a translation via code: use the translation service
        this.translate.get('Motions').subscribe((res: string) => {
            console.log('translation of motions in the target language: ' + res);
        });

        //start autoupdate if the user is logged in:
        this.operator.whoAmI().subscribe(resp => {
            if (resp.user) {
                this.autoupdateService.startAutoupdate();
            } else {
                //if whoami is not sucsessfull, forward to login again
                this.operator.clear();
                this.router.navigate(['/login']);
            }
        });
    }

    selectLang(lang: string): void {
        console.log('selected langauge: ', lang);
        console.log('get Langs : ', this.translate.getLangs());

        this.translate.use(lang).subscribe(res => {
            console.log('language changed : ', res);
        });
    }

    logOutButton() {
        console.log('logout');
        this.authService.logout().subscribe();
        this.router.navigate(['/login']);
    }
}
