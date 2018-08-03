import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

import { TranslateService } from '@ngx-translate/core'; //showcase

// for testing the DS and BaseModel
import { OperatorService } from 'app/core/services/operator.service';
import { User } from 'app/shared/models/users/user';

@Component({
    selector: 'app-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css']
})
export class StartComponent extends BaseComponent implements OnInit {
    //useage of translation with variables in code and view
    username = { user: this.operator.username };

    constructor(titleService: Title, protected translate: TranslateService, private operator: OperatorService) {
        super(titleService, translate);
    }

    ngOnInit() {
        super.setTitle('Home');
    }

    //quick testing of some data store functions
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

    giveDataStore() {
        this.DS.printWhole();
    }

    // shows how to use synchronous translations:
    TranslateTest() {
        console.log('lets translate the word "motion" in the current in the current lang');
        console.log('Motions in ' + this.translate.currentLang + ' is ' + this.translate.instant('Motions'));
    }
}
