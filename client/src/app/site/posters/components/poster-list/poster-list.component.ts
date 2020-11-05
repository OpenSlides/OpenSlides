import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { OperatorService } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { PosterRepositoryService } from 'app/core/repositories/posters/poster-repository.service';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ViewPoster } from '../../models/view-poster';

interface InfoDialog {
    title: string;
    published: boolean;
}

@Component({
    selector: 'os-poster-list',
    templateUrl: './poster-list.component.html',
    styleUrls: ['./poster-list.component.scss']
})
export class PosterListComponent extends BaseListViewComponent<ViewPoster> implements OnInit {
    /**
     * The reference to the template.
     */
    @ViewChild('posterInfoDialog', { static: true })
    private posterInfoDialog: TemplateRef<string>;

    public filterProps = ['title'];

    /**
     * Declares the dialog for editing.
     */
    public infoDialog: InfoDialog;

    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            width: 'auto'
        },
        {
            prop: 'info',
            width: '15%'
        }
    ];

    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        storage: StorageService,
        public repo: PosterRepositoryService,
        private dialog: MatDialog,
        private operator: OperatorService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        super(titleService, translate, matSnackBar, storage);
    }

    public ngOnInit(): void {
        super.setTitle('Posters');
    }

    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    public openEditInfo(poster: ViewPoster, ev: MouseEvent): void {
        if (this.isMultiSelect || !this.operator.hasPerms(this.permission.postersCanManage)) {
            return;
        }
        ev.stopPropagation();
        this.infoDialog = {
            title: poster.title,
            published: poster.published
        };

        const dialogRef = this.dialog.open(this.posterInfoDialog, infoDialogSettings);

        this.subscriptions.push(
            dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
                if (event.key === 'Enter' && event.shiftKey) {
                    dialogRef.close(this.infoDialog);
                }
            }),
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.repo.update(result, poster);
                }
            })
        );
    }
}
