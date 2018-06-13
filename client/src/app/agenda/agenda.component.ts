import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css']
})
export class AgendaComponent extends BaseComponent implements OnInit {

  constructor(titleService: Title) { 
    super(titleService) 
  }

  ngOnInit() {
    //TODO translate
    super.setTitle("Agenda");
  }

}
