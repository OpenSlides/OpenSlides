import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { ItemListSlideComponent } from './item-list-slide.component';

describe('ItemListSlideComponent', () => {
    let component: ItemListSlideComponent;
    let fixture: ComponentFixture<ItemListSlideComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [E2EImportsModule],
                declarations: [ItemListSlideComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ItemListSlideComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
