import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaTextBlockComponent } from './meta-text-block.component';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MetaTextBlockComponent', () => {
    let component: MetaTextBlockComponent;
    let fixture: ComponentFixture<MetaTextBlockComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [MetaTextBlockComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MetaTextBlockComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
