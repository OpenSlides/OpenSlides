import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsListComponent } from './settings-list.component';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('SettingsListComponent', () => {
    let component: SettingsListComponent;
    let fixture: ComponentFixture<SettingsListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [SettingsListComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
