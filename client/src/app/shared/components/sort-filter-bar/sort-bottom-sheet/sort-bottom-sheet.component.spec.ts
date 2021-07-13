import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { SortBottomSheetComponent } from './sort-bottom-sheet.component';

describe('SortBottomSheetComponent', () => {
    let fixture: ComponentFixture<SortBottomSheetComponent<any>>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(SortBottomSheetComponent);
        // component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // it('should create', () => {
    //    expect(component).toBeTruthy();
    // });
});
