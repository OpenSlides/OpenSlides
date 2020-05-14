import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core'; // showcase

import { OperatorService } from 'app/core/core-services/operator.service';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { environment } from 'environments/environment';
import { HttpService } from 'app/core/core-services/http.service';

/**
 * Interface describes the keys for the fields at start-component.
 */
interface IStartContent {
    general_event_welcome_title: string;
    general_event_welcome_text: string;
}

/**
 * The start component. Greeting page for OpenSlides
 */
@Component({
    selector: 'os-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss']
})
export class StartComponent extends BaseViewComponent implements OnInit {
    /**
     * Whether the user is editing the content.
     */
    public isEditing = false;

    /**
     * Formular for the content.
     */
    public startForm: FormGroup;

    /**
     * Holding the values for the content.
     */
    public startContent: IStartContent = {
        general_event_welcome_title: '',
        general_event_welcome_text: ''
    };

    /**
     * Constructor of the StartComponent
     *
     * @param titleService the title serve
     * @param translate to translation module
     * @param configService read out config values
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        private configService: ConfigService,
        private configRepo: ConfigRepositoryService,
        private fb: FormBuilder,
        private operator: OperatorService,
        private http: HttpService,
    ) {
        super(titleService, translate, matSnackbar);
        this.startForm = this.fb.group({
            general_event_welcome_title: ['', Validators.required],
            general_event_welcome_text: ''
        });
    }

    /**
     * Init the component.
     *
     * Sets the welcomeTitle and welcomeText.
     */
    public ngOnInit(): void {
        super.setTitle('Home');

        // set the welcome title
        this.configService
            .get<string>('general_event_welcome_title')
            .subscribe(welcomeTitle => (this.startContent.general_event_welcome_title = welcomeTitle));

        // set the welcome text
        this.configService.get<string>('general_event_welcome_text').subscribe(welcomeText => {
            this.startContent.general_event_welcome_text = this.translate.instant(welcomeText);
        });
    }

    public async setpresence(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/setpresence/", true);
        console.log(response);
    }

    public async setpresence_no_autoupdate(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/setpresence-no-autoupdate/", true);
        console.log(response);
    }

    public async setpresence_only_autoupdate(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/setpresence-only-autoupdate/", true);
        console.log(response);
    }

    public async simple_autoupdate(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/simple-autoupdate/", true);
        console.log(response);
    }

    public async simple_autoupdate_no_history(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/simple-autoupdate-no-history/", true);
        console.log(response);
    }

    public async echo(): Promise<void> {
        const data = {data: Math.random().toString(36).substring(7)};
        const response = await this.http.post(environment.urlPrefix + "/users/echo/", data);
        console.log(response);
    }

    public async echoLogin(): Promise<void> {
        const data = {data: Math.random().toString(36).substring(7)};
        const response = await this.http.post(environment.urlPrefix + "/users/echo-login/", data);
        console.log(response);
    }

    public async getConfig(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/get-config/");
        console.log(response);
    }

    public async getConfigLogin(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/get-config-login/");
        console.log(response);
    }

    public async currentAutoupdate(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/current-autoupdate/");
        console.log(response);
    }

    public async currentAutoupdateLogin(): Promise<void> {
        const response = await this.http.post(environment.urlPrefix + "/users/current-autoupdate-login/");
        console.log(response);
    }

    /**
     * Changes to editing mode.
     */
    public editStartPage(): void {
        Object.keys(this.startForm.controls).forEach(control => {
            this.startForm.patchValue({ [control]: this.startContent[control] });
        });
        this.isEditing = true;
    }

    /**
     * Saves changes and updates the content.
     */
    public saveChanges(): void {
        this.configRepo
            .bulkUpdate(
                Object.keys(this.startForm.controls).map(control => ({
                    key: control,
                    value: this.startForm.value[control]
                }))
            )
            .then(() => (this.isEditing = !this.isEditing), this.raiseError);
    }

    /**
     * Returns, if the current user has the necessary permissions.
     */
    public canManage(): boolean {
        return this.operator.hasPerms('core.can_manage_config');
    }
}
