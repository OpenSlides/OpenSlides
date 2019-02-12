import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorySortComponent } from './category-sort.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('CategorySortComponent', () => {
    let component: CategorySortComponent;
    let fixture: ComponentFixture<CategorySortComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CategorySortComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CategorySortComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
