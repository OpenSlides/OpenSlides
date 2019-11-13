import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentPollVoteComponent } from './assignment-poll-vote.component';

describe('AssignmentPollVoteComponent', () => {
    let component: AssignmentPollVoteComponent;
    let fixture: ComponentFixture<AssignmentPollVoteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AssignmentPollVoteComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentPollVoteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
