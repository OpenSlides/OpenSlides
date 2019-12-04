import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPollManagerComponent } from './motion-poll-manager.component';
import { MotionPollPreviewComponent } from '../motion-poll-preview/motion-poll-preview.component';

describe('MotionPollManagerComponent', () => {
    let component: MotionPollManagerComponent;
    let fixture: ComponentFixture<MotionPollManagerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionPollManagerComponent, MotionPollPreviewComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionPollManagerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
