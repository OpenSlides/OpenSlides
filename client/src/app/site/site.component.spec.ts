import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteComponent } from './site.component';
import { E2EImportsModule } from '../../e2e-imports.module';

describe('SiteComponent', () => {
    let component: SiteComponent;
    let fixture: ComponentFixture<SiteComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [SiteComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SiteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
