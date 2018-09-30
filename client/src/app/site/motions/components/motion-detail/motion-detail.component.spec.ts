import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionDetailComponent } from './motion-detail.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { MotionsModule } from '../../motions.module';

describe('MotionDetailComponent', () => {
    let component: MotionDetailComponent;
    let fixture: ComponentFixture<MotionDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule, MotionsModule],
            declarations: []
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
