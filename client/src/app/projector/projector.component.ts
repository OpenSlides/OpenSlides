import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-projector',
  templateUrl: './projector.component.html',
  styleUrls: ['./projector.component.css']
})
export class ProjectorComponent extends BaseComponent implements OnInit {

  constructor(protected titleService: Title) { 
    super(titleService) 
  }

  ngOnInit() {
    super.setTitle("Projector");
  }

}
