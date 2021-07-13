import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfigFieldComponent } from '../config-field/config-field.component';
import { ConfigListComponent } from './config-list.component';
import { CustomTranslationComponent } from '../custom-translation/custom-translation.component';
import { E2EImportsModule } from '../../../../../e2e-imports.module';

describe('ConfigListComponent', () => {
    let component: ConfigListComponent;
    let fixture: ComponentFixture<ConfigListComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [ConfigListComponent, ConfigFieldComponent, CustomTranslationComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfigListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
