import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { ViewUser } from '../models/view-user';
import { UserRepositoryService } from '../services/user-repository.service';
import { ListViewBaseComponent } from '../../base/list-view-base';

/**
 * Component for the user list view.
 *
 */
@Component({
    selector: 'os-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent extends ListViewBaseComponent<ViewUser> implements OnInit {
    /**
     * content of the ellipsis menu
     */
    public userMenuList = [
        {
            text: 'Groups',
            icon: 'users',
            action: 'toGroups'
        },
        {
            text: 'Import',
            icon: 'download',
            action: 'toGroups'
        },
        {
            text: 'Export',
            icon: 'file-export',
            action: 'toGroups'
        }
    ];

    /**
     * The usual constructor for components
     * @param repo the user repository
     * @param titleService
     * @param translate
     */
    public constructor(
        private repo: UserRepositoryService,
        protected titleService: Title,
        protected translate: TranslateService
    ) {
        super(titleService, translate);
    }

    /**
     * Init function
     *
     * sets the title, inits the table and calls the repo
     */
    public ngOnInit(): void {
        super.setTitle('Users');
        this.initTable();
        this.repo.getViewModelListObservable().subscribe(newUsers => {
            this.dataSource.data = newUsers;
        });
    }

    /**
     * Navigate to import page or do it inline
     *
     * TODO: implement importing of users
     */
    public import(): void {
        console.log('click on Import');
    }

    /**
     * Navigate to groups page
     * TODO: implement
     */
    public toGroups(): void {
        console.log('to Groups');
    }

    /**
     * Handles the click on a user row
     * @param row selected row
     */
    public selectUser(row: ViewUser): void {
        console.log('clicked the row for user: ', row);
    }

    /**
     * Handles the click on the plus button
     */
    public onPlusButton(): void {
        console.log('new User');
    }
}
