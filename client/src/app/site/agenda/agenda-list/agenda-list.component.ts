import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

@Component({
    selector: 'app-agenda-list',
    templateUrl: './agenda-list.component.html',
    styleUrls: ['./agenda-list.component.css']
})
export class AgendaListComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title) {
        super(titleService);
    }

    ngOnInit() {
        //TODO translate
        super.setTitle('Agenda');
    }

    downloadAgendaButton() {
        console.log('Clock Download Button');
    }
}
