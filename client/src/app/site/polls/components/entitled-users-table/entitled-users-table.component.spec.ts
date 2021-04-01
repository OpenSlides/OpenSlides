import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { EntitledUsersTableComponent } from './entitled-users-table.component';

describe('EntitledUsersTableComponent', () => {
    let component: EntitledUsersTableComponent;
    let fixture: ComponentFixture<EntitledUsersTableComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EntitledUsersTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
