import { async, ComponentFixture, TestBed } from '@angular/core/testing';

// import { ChoiceDialogComponent } from './choice-dialog.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ChoiceDialogComponent', () => {
    // let component: ChoiceDialogComponent;
    // let fixture: ComponentFixture<ChoiceDialogComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

   // TODO: You cannot create this component in the standard way. Needs different testing.
   beforeEach(() => {
    /*fixture = TestBed.createComponent(PromptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();*/
});

/*it('should create', () => {
    expect(component).toBeTruthy();
});*/
});
