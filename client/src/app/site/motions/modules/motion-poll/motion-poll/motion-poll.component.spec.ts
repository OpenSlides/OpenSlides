import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPollVoteComponent } from '../motion-poll-vote/motion-poll-vote.component';
import { MotionPollComponent } from './motion-poll.component';

describe('MotionPollComponent', () => {
    let component: MotionPollComponent;
    let fixture: ComponentFixture<MotionPollComponent>;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionPollComponent, MotionPollVoteComponent]
        }).compileComponents();
    }));
    beforeEach(() => {
        fixture = TestBed.createComponent(MotionPollComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
