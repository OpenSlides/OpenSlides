import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import { BaseSlideComponentDirective } from 'app/slides/base-slide-component';
import { PosterSlideData } from './poster-slide-data';

@Component({
    selector: 'os-posters',
    templateUrl: './poster-slide.component.html',
    styleUrls: ['./poster-slide.component.scss']
})
export class PosterSlideComponent extends BaseSlideComponentDirective<PosterSlideData> implements AfterViewInit {
    @ViewChild('graphContainer') public graphContainer: ElementRef;

    private graph: mxGraph;

    public ngAfterViewInit(): void {
        this.initMxGraph();
        this.loadPostersXml();
    }

    private initMxGraph(): void {
        if (this.graphContainer) {
            mxEvent.disableContextMenu(this.graphContainer.nativeElement);
            this.graph = new mxGraph(this.graphContainer.nativeElement);
            this.graph.enabled = false;
        }
    }

    private async loadPostersXml(): Promise<void> {
        const xmlString = this.data?.data?.xml;
        if (xmlString) {
            const xmlDocument = mxUtils.parseXml(xmlString);
            const xmlNode = xmlDocument.documentElement;
            const decoder = new mxCodec(xmlDocument);
            decoder.decode(xmlNode, this.graph.getModel());
        }
    }
}
