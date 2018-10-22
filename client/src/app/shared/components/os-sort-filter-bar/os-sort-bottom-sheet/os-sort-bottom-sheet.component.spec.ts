import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { E2EImportsModule } from 'e2e-imports.module';

import { OsSortBottomSheetComponent } from './os-sort-bottom-sheet.component';


describe('OsSortBottomSheetComponent', () => {
    // let component: OsSortBottomSheetComponent<any>;
    let fixture: ComponentFixture<OsSortBottomSheetComponent<any>>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(OsSortBottomSheetComponent);
        // component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // it('should create', () => {
    //    expect(component).toBeTruthy();
    // });
});
