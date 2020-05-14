import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import { Permission } from './operator.service';

/**
 * This represents one entry in the main menu
 */
export interface MainMenuEntry {
    /**
     * The route for the router to navigate to on click.
     */
    route: string;
    /**
     * The display string to be shown.
     */
    displayName: string;

    /**
     * The font awesom icon to display.
     */
    icon: string;

    /**
     * For sorting the entries.
     */
    weight: number;

    /**
     * The permission to see the entry.
     */
    permission: Permission;
}

/**
 * Collects main menu entries and provides them to the main menu component.
 */
@Injectable({
    providedIn: 'root'
})
export class MainMenuService {
    /**
     * A list of sorted entries.
     */
    private _entries: MainMenuEntry[] = [];

    /**
     * Observed by the site component.
     * If a new value appears the sideNavContainer gets toggled
     */
    public toggleMenuSubject = new Subject<void>();

    /**
     * Make the entries public.
     */
    public get entries(): MainMenuEntry[] {
        return this._entries;
    }

    public constructor() {}

    /**
     * Adds entries to the mainmenu.
     * @param entries The entries to add
     */
    public registerEntries(entries: MainMenuEntry[]): void {
        this._entries.push(...entries);
        this._entries = this._entries.sort((a, b) => a.weight - b.weight);
    }

    /**
     * Emit signal to toggle the main Menu
     */
    public toggleMenu(): void {
        this.toggleMenuSubject.next();
    }
}
