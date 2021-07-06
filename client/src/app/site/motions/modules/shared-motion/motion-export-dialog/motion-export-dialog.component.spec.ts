import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionExportDialogComponent } from './motion-export-dialog.component';

describe('MotionExportDialogComponent', () => {
    let component: MotionExportDialogComponent;
    let fixture: ComponentFixture<MotionExportDialogComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [MotionExportDialogComponent],
                providers: [{ provide: MatDialogRef, useValue: {} }]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(MotionExportDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
