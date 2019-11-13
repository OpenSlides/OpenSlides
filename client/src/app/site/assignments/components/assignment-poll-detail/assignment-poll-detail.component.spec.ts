import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentPollDetailComponent } from './assignment-poll-detail.component';

describe('AssignmentPollDetailComponent', () => {
    let component: AssignmentPollDetailComponent;
    let fixture: ComponentFixture<AssignmentPollDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AssignmentPollDetailComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentPollDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
