import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionsMotionSlideComponent } from './motions-motion-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('MotionsMotionSlideComponent', () => {
    let component: MotionsMotionSlideComponent;
    let fixture: ComponentFixture<MotionsMotionSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionsMotionSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionsMotionSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
