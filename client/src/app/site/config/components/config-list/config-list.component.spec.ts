import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../../e2e-imports.module';
import { ConfigListComponent } from './config-list.component';
import { ConfigFieldComponent } from '../config-field/config-field.component';
import { CustomTranslationComponent } from '../custom-translation/custom-translation.component';

describe('ConfigListComponent', () => {
    let component: ConfigListComponent;
    let fixture: ComponentFixture<ConfigListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [ConfigListComponent, ConfigFieldComponent, CustomTranslationComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfigListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
