import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreCountdownSlideComponent } from './core-countdown-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CoreCountdownSlideComponent', () => {
    let component: CoreCountdownSlideComponent;
    let fixture: ComponentFixture<CoreCountdownSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CoreCountdownSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CoreCountdownSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
