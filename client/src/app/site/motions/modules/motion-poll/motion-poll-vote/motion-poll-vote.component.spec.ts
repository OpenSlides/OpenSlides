import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPollVoteComponent } from './motion-poll-vote.component';

describe('MotionPollVoteComponent', () => {
    let component: MotionPollVoteComponent;
    let fixture: ComponentFixture<MotionPollVoteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionPollVoteComponent]
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
