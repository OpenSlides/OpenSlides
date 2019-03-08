import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatuteImportListComponent } from './statute-import-list.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('StatuteImportListComponent', () => {
    let component: StatuteImportListComponent;
    let fixture: ComponentFixture<StatuteImportListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [StatuteImportListComponent],
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(StatuteImportListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
