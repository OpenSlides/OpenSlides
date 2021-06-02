import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { CallDialogComponent } from './call-dialog.component';

describe('CallDialogComponent', () => {
    let component: CallDialogComponent;
    let fixture: ComponentFixture<CallDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CallDialogComponent],
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CallDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
