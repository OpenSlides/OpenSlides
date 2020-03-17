import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { MotionPollSlideComponent } from './motion-poll-slide.component';

describe('MotionPollSlideComponent', () => {
    let component: MotionPollSlideComponent;
    let fixture: ComponentFixture<MotionPollSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionPollSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionPollSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
