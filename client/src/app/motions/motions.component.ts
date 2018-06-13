import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-motions',
  templateUrl: './motions.component.html',
  styleUrls: ['./motions.component.css']
})
export class MotionsComponent extends BaseComponent implements OnInit {

  constructor(titleService: Title) { 
    super(titleService) 
  }

  ngOnInit() {
    super.setTitle("Motions");
  }

}
