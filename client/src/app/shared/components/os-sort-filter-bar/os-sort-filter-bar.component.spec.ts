import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';
import { OsSortFilterBarComponent } from './os-sort-filter-bar.component';

describe('OsSortFilterBarComponent', () => {
    let component: OsSortFilterBarComponent<any>;
    let fixture: ComponentFixture<any>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OsSortFilterBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
