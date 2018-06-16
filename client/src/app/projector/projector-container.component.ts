import { Component, OnInit } from '@angular/core';
import { TitleService } from '../core/title.service';

@Component({
    selector: 'app-projector-container',
    templateUrl: './projector-container.component.html',
    styleUrls: ['./projector-container.component.css']
})
export class ProjectorContainerComponent implements OnInit {

    constructor(protected titleService: TitleService) { 
    }

    ngOnInit() {
        this.titleService.setTitle('Projector');
    }

}
