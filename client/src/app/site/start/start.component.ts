import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

// for testing the DS and BaseModel
import { User } from 'app/core/models/user';
import { DS } from 'app/core/services/DS.service';

@Component({
    selector: 'app-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css']
})
export class StartComponent extends BaseComponent implements OnInit {
    private dS: DS;

    constructor(titleService: Title, dS: DS) {
        super(titleService);
        this.dS = dS;
    }

    ngOnInit() {
        super.setTitle('Start page');
    }

    test() {
        // This can be a basic unit test ;)
        // console.log(User.get(1));
        const user1: User = new User(32, 'testuser');
        const user2: User = new User(42, 'testuser 2');

        console.log(`User1 | ID ${user1.id}, Name: ${user1.username}`);
        console.log(`User2 | ID ${user2.id}, Name: ${user2.username}`);

        this.dS.inject(user1);
        this.dS.inject(user2);
        console.log('All users = ', this.dS.getAll('users/user'));

        console.log('try to get user with ID 1:');
        const user1fromStore = this.dS.get('users/user', 1);
        console.log('the user: ', user1fromStore);

        console.log('inject many:');
        this.dS.injectMany([user1, user2]);

        console.log('eject user 1');
        this.dS.eject('users/user', user1.id);
        console.log(this.dS.getAll('users/user'));

        // console.log(User.filter(user => user.id === 1));
        // console.log(User.filter(user => user.id === 2));
    }
}
