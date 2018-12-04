import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MotionImportListComponent } from './motion-import-list.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionImportListComponent', () => {
    let component: MotionImportListComponent;
    let fixture: ComponentFixture<MotionImportListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MotionImportListComponent],
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionImportListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
