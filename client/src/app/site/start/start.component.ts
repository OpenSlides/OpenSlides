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
    constructor(titleService: Title) {
        super(titleService);
    }

    ngOnInit() {
        super.setTitle('Start page');
    }

    test() {
        // This can be a basic unit test ;)
        console.log(User.get(1));
        const user1: User = new User(1);
        user1.username = 'testuser';
        const user2: User = new User(2);
        user2.username = 'testuser2';

        DS.injectMany(User.getCollectionString(), [user1, user2]);
        console.log(User.getAll());
        console.log(User.filter(user => user.id === 1));

        DS.eject(User.getCollectionString(), user1.id);
        console.log(User.getAll());
        console.log(User.filter(user => user.id === 1));
        console.log(User.filter(user => user.id === 2));
    }
}
