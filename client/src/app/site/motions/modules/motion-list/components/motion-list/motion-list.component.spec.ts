import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionListComponent } from './motion-list.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionListComponent', () => {
    let component: MotionListComponent;
    let fixture: ComponentFixture<MotionListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MotionListComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
