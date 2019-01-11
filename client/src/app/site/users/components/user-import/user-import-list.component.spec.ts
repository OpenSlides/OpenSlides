import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserImportListComponent } from './user-import-list.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('UserImportListComponent', () => {
    let component: UserImportListComponent;
    let fixture: ComponentFixture<UserImportListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [UserImportListComponent],
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UserImportListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
