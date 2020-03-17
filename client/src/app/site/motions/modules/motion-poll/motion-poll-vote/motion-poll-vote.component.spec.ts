import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PollProgressComponent } from 'app/site/polls/components/poll-progress/poll-progress.component';
import { MotionPollVoteComponent } from './motion-poll-vote.component';

describe('MotionPollVoteComponent', () => {
    let component: MotionPollVoteComponent;
    let fixture: ComponentFixture<MotionPollVoteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionPollVoteComponent, PollProgressComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionPollVoteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
