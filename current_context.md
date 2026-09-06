# Current Context

- **Active Branch:** `world` (World Studio, Dynamic Schemas, Timeline & State Fold Engine).
- **Execution Constraints:** **Strictly DO NOT push changes to remote git without explicit user permission.** Local signed commits (`git commit -S`) are standard.
- **Last Completed Task:** **First-Class & Second-Class Blueprint Architecture with Dynamic Enum Categories, Blueprint References, and Mathematical Formula Engine** (`BLOCK_WORLD_CUSTOM_BLUEPRINTS_001`).
  - **Complete Freedom in Blueprint Creation**: Users can create blueprints from complete scratch, defining custom categories, freeform domain tags, and arbitrary dynamic fields.
  - **First-Class & Second-Class Blueprint Hierarchy**:
    - **1st-Class Blueprints (Entity Archetypes)**: Instantiate tangible entities in the timeline (Characters, Sacred Relics, Realms, Factions) with causal state folds and history logs.
    - **2nd-Class Blueprints (Sub-Blueprints & Value Objects)**: Reusable embedded data structures and scale gauges (e.g. `Romantic Affection Scale`, `Cultivation Rank & Mastery`, `Power Matrices`) that can be referenced as fields in 1st-Class or other 2nd-Class blueprints.
  - **User-Defined Enum Categories & Options**: Users can define dynamic option tags on enum fields (e.g., `gender` with options `Male`, `Female`, `Dual-Yin-Yang`, `Celestial`).
  - **Dynamic Blueprint References**: Fields can reference other First-Class or Second-Class blueprints (e.g., `romantic_feelings` referencing `Romantic Affection Scale` and `cultivation` referencing `Cultivation Rank & Mastery`).
  - **Mathematical & Logical Formula Engine**:
    - Created safe, sandboxed expression parser and evaluator ([`formulaEngine.ts`](file:///home/yogesh/Projects/NovWrite/apps/web/src/lib/engine/formulaEngine.ts)).
    - Supports full arithmetic (`+`, `-`, `*`, `/`, `%`, `^`), parentheses, dot-notation variables (e.g. `cultivation.major_realm`), logical conditionals (`IF`), and math functions (`CLAMP`, `MIN`, `MAX`, `SQRT`, `POW`).
    - Successfully evaluated user's exact formula: `(cultivation.major_realm * cultivation.minor_realm) * special_Physique + attack * attack_technique_Mastery - defence * defence_technique_mastery`.
    - Live real-time evaluation in entity create/update forms and blueprint test sandboxes.
  - **Testing & Quality Assurance**: 100% test pass rate (32/32 tests), 0 svelte-check warnings/errors, and complete Zero-Badge UI adherence.
- **Current State:** First-Class and Second-Class Blueprint system with mathematical formulas and dynamic enums fully implemented and verified.
- **Next Steps:** Request user confirmation before pushing to remote `origin/world` or proceeding to novel branch / subsequent milestones.
