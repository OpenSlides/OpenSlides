import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadBarComponent } from './head-bar.component';

describe('HeadBarComponent', () => {
    let component: HeadBarComponent;
    let fixture: ComponentFixture<HeadBarComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HeadBarComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HeadBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
