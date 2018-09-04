import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

import { TranslateService } from '@ngx-translate/core'; // showcase

// for testing the DS and BaseModel
import { User } from 'app/shared/models/users/user';
import { Config } from '../../shared/models/core/config';
import { Motion } from '../../shared/models/motions/motion';
import { MotionVersion } from '../../shared/models/motions/motion-version';
import { MotionSubmitter } from '../../shared/models/motions/motion-submitter';

@Component({
    selector: 'os-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css']
})
export class StartComponent extends BaseComponent implements OnInit {
    public welcomeTitle: string;
    public welcomeText: string;

    /**
     * Constructor of the StartComponent
     *
     * @param titleService the title serve
     * @param translate to translation module
     */
    public constructor(titleService: Title, protected translate: TranslateService) {
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
    public ngOnInit() {
        // required dummy translation, cause translations for config values were never set
        // tslint:disable-next-line
        const welcomeTitleTranslateDummy = this.translate.instant('Welcome to OpenSlides');
        super.setTitle('Home');

        // set welcome title and text
        const welcomeTitleConfig = this.DS.filter<Config>(
            Config,
            config => config.key === 'general_event_welcome_title'
        )[0] as Config;

        if (welcomeTitleConfig) {
            this.welcomeTitle = welcomeTitleConfig.value as string;
        }

        const welcomeTextConfig = this.DS.filter<Config>(
            Config,
            config => config.key === 'general_event_welcome_text'
        )[0] as Config;

        if (welcomeTextConfig) {
            this.welcomeText = welcomeTextConfig.value as string;
        }

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
    public DataStoreTest() {
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
    public giveDataStore() {
        this.DS.printWhole();
    }

    /**
     * test translations in component
     */
    public TranslateTest() {
        console.log('lets translate the word "motion" in the current in the current lang');
        console.log('Motions in ' + this.translate.currentLang + ' is ' + this.translate.instant('Motions'));
    }

    /**
     * Adds random generated motions
     */
    public createMotions(requiredMotions: number): void {
        console.log('adding ' + requiredMotions + ' Motions.');
        const newMotionsArray = [];

        const longMotionText = `
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.

        Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.

        Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.

        Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.

        Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis.

        At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, At accusam aliquyam diam diam dolore dolores duo eirmod eos erat, et nonumy sed tempor et et invidunt justo labore Stet clita ea et gubergren, kasd magna no rebum. sanctus sea sed takimata ut vero voluptua. est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat.

        Consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus.

        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.

        Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.

        Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.

        Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo
        `;

        for (let i = 1; i <= requiredMotions; ++i) {
            // version
            const newMotionVersion = new MotionVersion(
                200 + i,
                1,
                'now',
                'GenMo ' + i,
                longMotionText,
                null,
                longMotionText
            );
            // submitter
            const newMotionSubmitter = new MotionSubmitter(1, 1, 200 + 1, 0);
            // motion
            const newMotion = new Motion(
                200 + i,
                'GenMo ' + i,
                [newMotionVersion],
                null,
                null,
                null,
                null,
                'Generated',
                [newMotionSubmitter],
                null,
                null,
                1
            );
            newMotionsArray.push(newMotion);
        }
        this.DS.add(...newMotionsArray);
        console.log('Done adding motions');
    }
}
