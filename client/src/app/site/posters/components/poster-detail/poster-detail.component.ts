import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    OnInit,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { PosterRepositoryService } from 'app/core/repositories/posters/poster-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Poster } from 'app/shared/models/posters/poster';
import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { CanComponentDeactivate } from 'app/shared/utils/watch-for-changes.guard';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewPoster } from '../../models/view-poster';

interface Shape {
    defaultText: string;
    width: number;
    height: number;
    mxShapeName: string;
    icon: string;
}

@Component({
    selector: 'os-poster-detail',
    templateUrl: './poster-detail.component.html',
    styleUrls: ['./poster-detail.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PosterDetailComponent
    extends BaseViewComponentDirective
    implements OnInit, AfterViewInit, CanComponentDeactivate {
    @ViewChild('xmlDialog', { static: true })
    private xmlDialog: TemplateRef<string>;

    @ViewChild('graphContainer') public graphContainer: ElementRef;

    /**
     * Determine if the motion is edited
     */
    public editPoster = false;
    public newPoster = false;

    /**
     * if set to true, do not jump into deactivate guard
     */
    private saving: boolean;

    public poster: ViewPoster;
    public posterForm: FormGroup;
    public xmlForm: FormGroup;

    private graph: mxGraph;
    private menuHandler: mxPopupMenuHandler;
    private parent: mxCell;
    private layout: mxParallelEdgeLayout;
    private layoutMgr: mxLayoutManager;

    public shapeList: Shape[] = [
        {
            defaultText: 'Label',
            width: 70,
            height: 20,
            // apparently, arrow is "text", "text" is square, and square is square as well...
            mxShapeName: `shape=${mxConstants.SHAPE_ARROW}`,
            icon: 'text_fields'
        },
        {
            defaultText: 'Square',
            width: 70,
            height: 70,
            mxShapeName: `shape=${mxConstants.SHAPE_RECTANGLE}`,
            icon: 'crop_square'
        },
        {
            defaultText: 'Circle',
            width: 70,
            height: 70,
            mxShapeName: `shape=${mxConstants.SHAPE_ELLIPSE}`,
            icon: 'radio_button_unchecked'
        },
        // cause no one needs triangles lol
        // {
        //     defaultText: 'Triangle',
        //     width: 50,
        //     height: 70,
        //     mxShapeName: `shape=${mxConstants.SHAPE_TRIANGLE}`,
        //     icon: 'play_arrow'
        // },
        {
            defaultText: 'Person',
            width: 60,
            height: 70,
            mxShapeName: `shape=${mxConstants.SHAPE_ACTOR}`,
            icon: 'person_outline'
        },
        {
            defaultText: 'Cloud',
            width: 70,
            height: 60,
            mxShapeName: `shape=${mxConstants.SHAPE_CLOUD}`,
            icon: 'cloud_queue'
        }
    ];

    public get canManage(): boolean {
        return this.operator.hasPerms(this.permission.postersCanManage);
    }

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private operator: OperatorService,
        private repo: PosterRepositoryService,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private promptService: PromptService,
        private router: Router,
        private dialog: MatDialog
    ) {
        super(title, translate, matSnackBar);
        this.createForm();
    }

    public ngOnInit(): void {
        const params = this.route.snapshot.params;
        if (params && params.id) {
            this.subscriptions.push(
                this.repo.getViewModelObservable(+params.id).subscribe(poster => {
                    if (poster) {
                        const title = poster.getTitle();
                        super.setTitle(title);
                        this.poster = poster;

                        if (this.graph) {
                            this.loadPostersXml();
                        }
                    }
                })
            );
        } else {
            // new poster
            super.setTitle('New poster');
            this.editPoster = true;
            this.newPoster = true;
        }
    }

    public ngAfterViewInit(): void {
        this.initMxGraph();
    }

    @HostListener('window:beforeunload')
    public async canDeactivate(): Promise<boolean> {
        if (this.editPoster && !this.saving) {
            const title = this.translate.instant('Do you really want to exit this page?');
            const content = this.translate.instant('You made changes.');
            return await this.promptService.open(title, content);
        }
        return true;
    }

    private initMxGraph(): void {
        // disable kontext menu
        mxEvent.disableContextMenu(this.graphContainer.nativeElement);
        this.graph = new mxGraph(this.graphContainer.nativeElement);
        this.graph.enabled = this.editPoster;

        this.parent = this.graph.getDefaultParent();
        this.graph.setPanning(true);
        this.graph.setTooltips(true);
        this.graph.setConnectable(true);
        this.graph.setMultigraph(false);

        // tslint:disable-next-line: no-unused-expression
        new mxKeyHandler(this.graph);
        // tslint:disable-next-line: no-unused-expression
        new mxRubberband(this.graph);

        /**
         * prevent double connections and allows for easier double arrows
         */
        this.layout = new mxParallelEdgeLayout(this.graph);
        this.layoutMgr = new mxLayoutManager(this.graph);
        this.layoutMgr.getLayout = cell => {
            if (cell.getChildCount() > 0) {
                return this.layout;
            }
        };

        /**
         * Elbow edge style
         */
        // const style = this.graph.getStylesheet().getDefaultEdgeStyle();
        // style[mxConstants.STYLE_ROUNDED] = true;
        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;

        /**
         * popup menu
         */
        this.menuHandler = this.graph.createPopupMenuHandler();
        this.menuHandler.factoryMethod = (menu, cell, evt) => {
            return this.createPopupMenu(this.graph, menu, cell, evt);
        };
        this.menuHandler.enabled = this.editPoster;

        if (this.poster && !this.newPoster) {
            this.loadPostersXml();
        }
    }

    public setEditMode(edit: boolean): void {
        this.editPoster = edit;
        this.graph.enabled = edit;
        this.menuHandler.enabled = edit;
        if (edit) {
            this.posterForm.patchValue({
                title: this.poster.title
            });
        }
    }

    public async cancelEdit(): Promise<void> {
        if (this.newPoster) {
            this.router.navigate(['./posters/']);
        } else {
            if (await this.canDeactivate()) {
                this.setEditMode(false);
            }
        }
    }

    public addObject(shape: Shape): void {
        this.graph.insertVertex(
            this.parent,
            null,
            shape.defaultText,
            0,
            0,
            shape.width,
            shape.height,
            shape.mxShapeName,
            false
        );
    }

    public changeColor(): void {
        const color = 'red';
        const cells: mxCell[] = this.graph.getSelectionCells();

        for (const cell of cells) {
            const currentStyles = cell.getStyle();
            // setCellStyle overwrites the current style
            this.graph.setCellStyle(`${currentStyles};${mxConstants.STYLE_FILLCOLOR}=${color}`, [cell]);
        }
    }

    public async savePoster(): Promise<void> {
        if (this.posterForm.valid) {
            const xmlString = this.getXml();

            const updatePoster = new Poster();
            updatePoster.title = this.posterForm.get('title').value;
            updatePoster.xml = xmlString;

            try {
                if (this.newPoster) {
                    const response = await this.repo.create(updatePoster);
                    this.saving = true;
                    this.router.navigate(['./posters/' + response.id]);
                } else {
                    await this.repo.update(updatePoster, this.poster);
                    this.setEditMode(false);
                }
            } catch (e) {
                this.raiseError(e);
            }
        }
    }

    private getXml(): string {
        const encoder = new mxCodec();
        const graphXml = encoder.encode(this.graph.getModel());
        const xmlString = mxUtils.getXml(graphXml);
        return xmlString;
    }

    private setGraphXml(xmlString: string): void {
        const xmlDocument = mxUtils.parseXml(xmlString);
        const xmlNode = xmlDocument.documentElement;
        const decoder = new mxCodec(xmlDocument);
        decoder.decode(xmlNode, this.graph.getModel());
        this.parent = this.graph.getDefaultParent();
    }

    public async loadPostersXml(): Promise<void> {
        if (this.poster?.xml) {
            this.setGraphXml(this.poster.xml);
        }
    }

    public async deletePoster(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this poster?');
        const content = this.poster.getTitle();
        if (await this.promptService.open(title, content)) {
            await this.repo.delete(this.poster);
            this.router.navigate(['../'], { relativeTo: this.route });
        }
    }

    private deleteSelectedCells(): void {
        this.graph.removeCells(this.graph.getSelectionCells(), true);
    }

    private createPopupMenu(graph: mxGraph, menu: mxPopupMenu, cell: mxCell, event: mxMouseEvent): any {
        if (cell !== null) {
            menu.addItem(this.translate.instant('Delete'), null, () => {
                graph.removeCells([cell], true);
            });

            menu.addItem(this.translate.instant('Move to front'), null, () => {
                graph.orderCells(false, [cell]);
            });

            menu.addItem(this.translate.instant('Move to back'), null, () => {
                graph.orderCells(true, [cell]);
            });
        }
    }

    public createForm(): void {
        this.posterForm = this.formBuilder.group({
            title: ['', Validators.required]
        });

        this.xmlForm = this.formBuilder.group({
            xmlString: ['']
        });
    }

    public openXmlDialog(): void {
        const dialogRef = this.dialog.open(this.xmlDialog, largeDialogSettings);

        this.xmlForm.patchValue({
            xmlString: this.getXml()
        });

        this.subscriptions.push(
            dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
                if (event.key === 'Enter' && event.shiftKey) {
                    dialogRef.close(true);
                }
                if (event.key === 'Escape') {
                    dialogRef.close(false);
                }
            }),
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    const newXml = this.xmlForm.get('xmlString').value;
                    this.setGraphXml(newXml);
                }
            })
        );
    }

    // example: https://github.com/jgraph/mxgraph/blob/master/javascript/examples/pagebreaks.html
    // However: most of the necessary function do not exist anymore.
    public onDownloadPdf(): void {
        const scale = 1.0;
        const borderSize = 30; // pixel
        const preview = new mxPrintPreview(this.graph, scale, null, borderSize);
        preview.autoOrigin = true;
        preview.open('');
    }

    @HostListener('document:keydown', ['$event']) public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape' || event.key === 'Delete') {
            this.deleteSelectedCells();
        }
    }
}
