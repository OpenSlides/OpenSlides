import { Injectable } from '@angular/core';

import { OperatorService, Permission } from './operator.service';

export interface AuthGuardFallbackEntry {
    route: string;
    weight: number;
    permission: Permission;
}

/**
 * Classical Auth-Guard. Checks if the user has to correct permissions to enter a page, and forwards to login if not.
 */
@Injectable({
    providedIn: 'root'
})
export class FallbackRoutesService {
    private fallbackEntries: AuthGuardFallbackEntry[] = [];

    /**
     * Constructor
     *
     * @param operator Asking for the required permission
     */
    public constructor(private operator: OperatorService) {}

    /**
     * Adds fallback navigation entries for the start page.
     * @param entries The entries to add
     */
    public registerFallbackEntries(entries: AuthGuardFallbackEntry[]): void {
        this.fallbackEntries.push(...entries);
        this.fallbackEntries = this.fallbackEntries.sort((a, b) => a.weight - b.weight);
    }

    public getFallbackRoute(): string | null {
        for (const entry of this.fallbackEntries) {
            if (this.operator.hasPerms(entry.permission)) {
                return entry.route;
            }
        }
    }
}
