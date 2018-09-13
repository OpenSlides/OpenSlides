import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchValueSelectorComponent } from './search-value-selector.component';

describe('SearchValueSelectorComponent', () => {
    let component: SearchValueSelectorComponent;
    let fixture: ComponentFixture<SearchValueSelectorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SearchValueSelectorComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchValueSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
