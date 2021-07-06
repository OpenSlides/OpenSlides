import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionListComponent } from './motion-list.component';
import { MotionMultiselectActionsComponent } from '../../../shared-motion/motion-multiselect-actions/motion-multiselect-actions.component';

describe('MotionListComponent', () => {
    let component: MotionListComponent;
    let fixture: ComponentFixture<MotionListComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [MotionListComponent, MotionMultiselectActionsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
