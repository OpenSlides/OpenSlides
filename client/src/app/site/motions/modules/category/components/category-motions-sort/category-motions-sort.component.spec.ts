import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { CategoryMotionsSortComponent } from './category-motions-sort.component';

describe('CategoryMotionsSortComponent', () => {
    let component: CategoryMotionsSortComponent;
    let fixture: ComponentFixture<CategoryMotionsSortComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [CategoryMotionsSortComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(CategoryMotionsSortComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
