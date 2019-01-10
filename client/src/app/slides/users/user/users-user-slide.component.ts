import { Component, OnInit } from '@angular/core';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { UsersUserSlideData } from './users-user-slide-model';

@Component({
    selector: 'os-users-user-slide',
    templateUrl: './users-user-slide.component.html',
    styleUrls: ['./users-user-slide.component.scss']
})
export class UsersUserSlideComponent extends BaseSlideComponent<UsersUserSlideData> implements OnInit {
    public constructor() {
        super();
    }

    public ngOnInit(): void {
        console.log('Hello from user slide');
    }
}
