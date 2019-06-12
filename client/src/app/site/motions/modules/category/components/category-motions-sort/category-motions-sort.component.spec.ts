import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryMotionsSortComponent } from './category-motions-sort.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('CategoryMotionsSortComponent', () => {
    let component: CategoryMotionsSortComponent;
    let fixture: ComponentFixture<CategoryMotionsSortComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [CategoryMotionsSortComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CategoryMotionsSortComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
