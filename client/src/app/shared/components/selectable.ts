import { Displayable } from '../../site/base/displayable';
import { Identifiable } from '../models/base/identifiable';

/**
 * Base Type for everything that should be displayable
 * in Shared Components
 */

export type Selectable = Displayable & Identifiable;
