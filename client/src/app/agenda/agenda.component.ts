import { Component, OnInit } from '@angular/core';
import { TitleService } from '../core/title.service';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css']
})
export class AgendaComponent implements OnInit {

  constructor(private titleService: TitleService) { 
  }

  ngOnInit() {
    this.titleService.setTitle("Agenda");
  }
}
