import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionBlockSlideComponent } from './motion-block-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('MotionBlockSlideComponent', () => {
    let component: MotionBlockSlideComponent;
    let fixture: ComponentFixture<MotionBlockSlideComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionBlockSlideComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionBlockSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
