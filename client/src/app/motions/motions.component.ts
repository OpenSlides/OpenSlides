import { Component, OnInit } from '@angular/core';
import { TitleService } from '../core/title.service';

@Component({
    selector: 'app-motions',
    templateUrl: './motions.component.html',
    styleUrls: ['./motions.component.css']
})
export class MotionsComponent implements OnInit {

    constructor(private titleService: TitleService) { 
    }

    ngOnInit() {
        this.titleService.setTitle("Motions");
    }

}
