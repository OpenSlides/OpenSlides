import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionPollDialogComponent } from './motion-poll-dialog.component';

describe('MotionPollAnalogVoteComponent', () => {
    let component: MotionPollDialogComponent;
    let fixture: ComponentFixture<MotionPollDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MotionPollDialogComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionPollDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
