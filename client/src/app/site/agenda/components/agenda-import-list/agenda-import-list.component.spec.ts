import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaImportListComponent } from './agenda-import-list.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AgendaImportListComponent', () => {
    let component: AgendaImportListComponent;
    let fixture: ComponentFixture<AgendaImportListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AgendaImportListComponent],
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AgendaImportListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
