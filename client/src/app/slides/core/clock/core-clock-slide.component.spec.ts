import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreClockSlideComponent } from './core-clock-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CoreClockSlideComponent', () => {
    let component: CoreClockSlideComponent;
    let fixture: ComponentFixture<CoreClockSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CoreClockSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CoreClockSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
