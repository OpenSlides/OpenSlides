import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { E2EImportsModule } from 'e2e-imports.module';

import { ProjectPointOfOrderComponent } from './project-point-of-order.component';

describe('ProjectPointOfOrderComponent', () => {
    let component: ProjectPointOfOrderComponent;
    let fixture: ComponentFixture<ProjectPointOfOrderComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [ProjectPointOfOrderComponent],
            providers: [
                { provide: MatDialogRef },
                {
                    provide: MAT_DIALOG_DATA
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectPointOfOrderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
