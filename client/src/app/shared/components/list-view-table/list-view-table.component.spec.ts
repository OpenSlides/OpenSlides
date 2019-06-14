import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListViewTableComponent } from './list-view-table.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ListViewTableComponent', () => {
    let component: ListViewTableComponent<any, any>;
    let fixture: ComponentFixture<ListViewTableComponent<any, any>>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ListViewTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
