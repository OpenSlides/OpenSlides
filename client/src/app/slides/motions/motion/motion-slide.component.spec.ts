import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionSlideComponent } from './motion-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('MotionsMotionSlideComponent', () => {
    let component: MotionSlideComponent;
    let fixture: ComponentFixture<MotionSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
