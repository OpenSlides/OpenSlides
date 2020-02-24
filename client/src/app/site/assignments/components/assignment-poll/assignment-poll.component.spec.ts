import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PollProgressComponent } from 'app/site/polls/components/poll-progress/poll-progress.component';
import { AssignmentPollVoteComponent } from '../assignment-poll-vote/assignment-poll-vote.component';
import { AssignmentPollComponent } from './assignment-poll.component';

describe('AssignmentPollComponent', () => {
    let component: AssignmentPollComponent;
    let fixture: ComponentFixture<AssignmentPollComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [AssignmentPollComponent, AssignmentPollVoteComponent, PollProgressComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentPollComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
