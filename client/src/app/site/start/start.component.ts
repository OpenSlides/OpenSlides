import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

import { TranslateService } from '@ngx-translate/core'; //showcase

// for testing the DS and BaseModel
import { OperatorService } from 'app/core/services/operator.service';
import { User } from 'app/shared/models/users/user';
import { Config } from '../../shared/models/core/config';

@Component({
    selector: 'app-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css']
})
export class StartComponent extends BaseComponent implements OnInit {
    welcomeTitle: string;
    welcomeText: string;
    username = { user: this.operator.username };

    /**
     * Constructor of the StartComponent
     *
     * @param titleService the title serve
     * @param translate to translation module
     * @param operator operator
     */
    constructor(titleService: Title, protected translate: TranslateService, private operator: OperatorService) {
        super(titleService, translate);
    }

    /**
     * Init the component.
     *
     * Sets the welcomeTitle and welcomeText.
     * Tries to read them from the DataStore (which will fail initially)
     * And observes DataStore for changes
     * Set title and observe DataStore for changes.
     */
    ngOnInit() {
        // required dummy translation, cause translations for config values were never set
        const welcomeTitleTranslateDummy = this.translate.instant('Welcome to OpenSlides');
        super.setTitle('Home');

        // set welcome title and text
        const welcomeTitleConfig = this.DS.filter(
            Config,
            config => config.key === 'general_event_welcome_title'
        )[0] as Config;

        if (welcomeTitleConfig) {
            this.welcomeTitle = welcomeTitleConfig.value as string;
        }

        const welcomeTextConfig = this.DS.filter(
            Config,
            config => config.key === 'general_event_welcome_text'
        )[0] as Config;

        if (welcomeTextConfig) {
            this.welcomeText = welcomeTextConfig.value as string;
        }
        console.log(this.DS.filter(Config, config => config.key === 'general_event_welcome_title'));

        // observe title and text in DS
        this.DS.getObservable().subscribe(newModel => {
            if (newModel instanceof Config) {
                if (newModel.key === 'general_event_welcome_title') {
                    this.welcomeTitle = newModel.value as string;
                } else if (newModel.key === 'general_event_welcome_text') {
                    this.welcomeText = newModel.value as string;
                }
            }
        });
    }

    /**
     * test data store
     */
    DataStoreTest() {
        console.log('add a user to dataStore');
        this.DS.add(new User(100));
        console.log('add three users to dataStore');
        this.DS.add(new User(200), new User(201), new User(202));
        console.log('use the spread operator "..." to add an array');
        const userArray = [];
        for (let i = 300; i < 400; i++) {
            userArray.push(new User(i));
        }
        this.DS.add(...userArray);

        console.log('try to get user with ID 1:');
        const user1fromStore = this.DS.get(User, 1);
        console.log('the user: ', user1fromStore);

        console.log('remove a single user:');
        this.DS.remove(User, 100);
        console.log('remove more users');
        this.DS.remove(User, 200, 201, 202);
        console.log('remove an array of users');
        this.DS.remove(User, ...[321, 363, 399]);

        console.log('test filter: ');
        console.log(this.DS.filter(User, user => user.id === 1));
    }

    /**
     * function to print datastore
     */
    giveDataStore() {
        this.DS.printWhole();
    }

    /**
     * test translations in component
     */
    TranslateTest() {
        console.log('lets translate the word "motion" in the current in the current lang');
        console.log('Motions in ' + this.translate.currentLang + ' is ' + this.translate.instant('Motions'));
    }
}
