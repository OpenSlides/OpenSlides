import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AmendmentCreateWizardComponent } from './amendment-create-wizard.component';

describe('AmendmentCreateWizardComponent', () => {
    let component: AmendmentCreateWizardComponent;
    let fixture: ComponentFixture<AmendmentCreateWizardComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [AmendmentCreateWizardComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AmendmentCreateWizardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
