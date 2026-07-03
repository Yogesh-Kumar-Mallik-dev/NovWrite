import test from "node:test";
import assert from "node:assert/strict";

import {
    createCharacterSchema,
    updateCharacterSchema,
    createCharacterInventorySchema,
    createCharacterRelationSchema,
} from "@/validate";

import { objectIdSchema } from "@/validate/common";

function objectId(seed = "a") {
    return seed.repeat(24);
}

test("objectIdSchema accepts valid ObjectId", () => {
    const parsed = objectIdSchema.safeParse(
        objectId("b")
    );

    assert.equal(parsed.success, true);
});

test("objectIdSchema rejects invalid ObjectId", () => {
    const parsed = objectIdSchema.safeParse("not-an-object-id");

    assert.equal(parsed.success, false);
});

test("createCharacterSchema succeeds with valid payload", () => {
    const payload = {
        name: "Lin Yue",
        spiritRootId: objectId("c"),
        basePower: 10,
        dateOfBirth: {
            year: 1200,
            month: 3,
            day: 12,
        },
    };

    const parsed = createCharacterSchema.safeParse(payload);

    assert.equal(parsed.success, true);
});

test("createCharacterSchema fails when required fields are missing", () => {
    const payload = {
        name: "Lin Yue",
    };

    const parsed = createCharacterSchema.safeParse(payload);

    assert.equal(parsed.success, false);
});

test("updateCharacterSchema allows partial payload", () => {
    const payload = {
        basePower: 99,
    };

    const parsed = updateCharacterSchema.safeParse(payload);

    assert.equal(parsed.success, true);
});

test("createCharacterInventorySchema fails on timeline anomaly when not allowed", () => {
    const payload = {
        characterId: objectId("d"),
        itemId: objectId("e"),
        obtainedAt: {
            year: 1200,
            month: 5,
            day: 5,
        },
        lostAt: {
            year: 1199,
            month: 1,
            day: 1,
        },
        allowTimelineAnomaly: false,
    };

    const parsed = createCharacterInventorySchema.safeParse(payload);

    assert.equal(parsed.success, false);
});

test("createCharacterInventorySchema succeeds when timeline anomaly is allowed", () => {
    const payload = {
        characterId: objectId("d"),
        itemId: objectId("e"),
        obtainedAt: {
            year: 1200,
            month: 5,
            day: 5,
        },
        lostAt: {
            year: 1199,
            month: 1,
            day: 1,
        },
        allowTimelineAnomaly: true,
    };

    const parsed = createCharacterInventorySchema.safeParse(payload);

    assert.equal(parsed.success, true);
});

test("createCharacterRelationSchema fails when source equals target", () => {
    const sameId = objectId("f");

    const payload = {
        sourceCharacterId: sameId,
        targetCharacterId: sameId,
        relationshipType: "Ally",
        description: "Alliance",
    };

    const parsed = createCharacterRelationSchema.safeParse(payload);

    assert.equal(parsed.success, false);
});

test("createCharacterRelationSchema succeeds for different characters", () => {
    const payload = {
        sourceCharacterId: objectId("f"),
        targetCharacterId: objectId("a"),
        relationshipType: "Ally",
        description: "Alliance",
    };

    const parsed = createCharacterRelationSchema.safeParse(payload);

    assert.equal(parsed.success, true);
});
