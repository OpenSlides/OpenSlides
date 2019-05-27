import { ProjectorElement } from 'app/shared/models/core/projector';

export interface MediafileProjectorElement extends ProjectorElement {
    // Images and Pdf
    rotation?: 0 | 90 | 180 | 270;

    // Images
    fullscreen?: boolean;

    // Pdf
    page?: number;
    zoom?: number; // 0 is normal, then +-1, +-2, ...
}
