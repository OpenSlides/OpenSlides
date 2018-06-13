import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent extends BaseComponent implements OnInit {

  constructor(titleService: Title) { 
    super(titleService) 
  }

  ngOnInit() {
    super.setTitle("Start page");
  }

}
