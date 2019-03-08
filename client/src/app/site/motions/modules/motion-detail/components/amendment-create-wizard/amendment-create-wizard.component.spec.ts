import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmendmentCreateWizardComponent } from './amendment-create-wizard.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AmendmentCreateWizardComponent', () => {
    let component: AmendmentCreateWizardComponent;
    let fixture: ComponentFixture<AmendmentCreateWizardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [AmendmentCreateWizardComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AmendmentCreateWizardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
