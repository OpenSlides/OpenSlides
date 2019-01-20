import { async, TestBed } from '@angular/core/testing';

// import { ProjectionDialogComponent } from './prjection-dialog.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ProjectionDialogComponent', () => {
    // let component: ProjectionDialogComponent;
    // let fixture: ComponentFixture<ProjectionDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    // TODO: You cannot create this component in the standard way. Needs different testing.
    beforeEach(() => {
        /*fixture = TestBed.createComponent(ProjectionDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();*/
    });

    /*it('should create', () => {
        expect(component).toBeTruthy();
    });*/
});
