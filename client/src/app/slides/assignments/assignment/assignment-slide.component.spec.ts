import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AssignmentSlideComponent } from './assignment-slide.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('AssignmentSlideComponent', () => {
    let component: AssignmentSlideComponent;
    let fixture: ComponentFixture<AssignmentSlideComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [AssignmentSlideComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AssignmentSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
