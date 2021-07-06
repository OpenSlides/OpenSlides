import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClockSlideComponent } from './clock-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('ClockSlideComponent', () => {
    let component: ClockSlideComponent;
    let fixture: ComponentFixture<ClockSlideComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [ClockSlideComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ClockSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
