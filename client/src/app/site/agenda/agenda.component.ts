import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

@Component({
    selector: 'app-agenda',
    templateUrl: './agenda.component.html',
    styleUrls: ['./agenda.component.css']
})
export class AgendaComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title) {
        super(titleService);
    }

    ngOnInit() {
        //TODO translate
        super.setTitle('Agenda');
    }
}
