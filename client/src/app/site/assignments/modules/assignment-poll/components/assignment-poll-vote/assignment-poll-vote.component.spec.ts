import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPollVoteComponent } from './assignment-poll-vote.component';

describe('AssignmentPollVoteComponent', () => {
    let component: AssignmentPollVoteComponent;
    let fixture: ComponentFixture<AssignmentPollVoteComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [AssignmentPollVoteComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentPollVoteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
