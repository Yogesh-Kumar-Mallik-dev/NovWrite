import { entitiesCoreRegistry } from "./entities.core";
import { entitiesItemsEventsRegistry } from "./entities.items.events";
import { entitiesCultivationWarRegistry } from "./entities.cultivation.war";

import type { CrudRegistryEntry } from "./types";

export type { CrudRegistryEntry } from "./types";

export const registry = {
    ...entitiesCoreRegistry,
    ...entitiesItemsEventsRegistry,
    ...entitiesCultivationWarRegistry,
} satisfies Record<string, CrudRegistryEntry>;

export type Domain = keyof typeof registry;
