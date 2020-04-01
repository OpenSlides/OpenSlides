import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { E2EImportsModule } from 'e2e-imports.module';

import { ProjectorEditDialogComponent } from './projector-edit-dialog.component';

describe('ProjectorEditDialogComponent', () => {
    let component: ProjectorEditDialogComponent;
    let fixture: ComponentFixture<ProjectorEditDialogComponent>;

    /**
     * A view model has to be injected here, hence it's currently not possbile (anymore)
     * to mock the creation of view models
     */
    const dialogData = null;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ProjectorEditDialogComponent],
            imports: [E2EImportsModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: dialogData
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectorEditDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
