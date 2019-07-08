import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionFieldComponent } from './extension-field.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ExtensionFieldComponent', () => {
    let component: ExtensionFieldComponent;
    let fixture: ComponentFixture<ExtensionFieldComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ExtensionFieldComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
