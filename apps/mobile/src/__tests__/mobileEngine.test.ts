/**
 * @file mobileEngine.test.ts
 * @description Unit tests for Mobile client state management, project switching, formula evaluations, timeline folds, and continuity audits.
 * Block Standard: BLOCK_TEST_MOBILE_ENGINE_001
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MobileStore } from "../lib/mobileStore.ts";
import { evaluateFormula } from "../lib/formulaEngine.ts";

describe("BLOCK_TEST_MOBILE_ENGINE_001: Mobile Client Store and Telemetry Engine", () => {
  let store: MobileStore;

  beforeEach(() => {
    store = new MobileStore();
  });

  it("should initialize clean with zero mock projects and null active project", () => {
    const state = store.getState();
    assert.equal(state.projects.length, 0);
    assert.equal(state.activeProjectId, null);
    assert.equal(store.getActiveProject(), null);
    assert.equal(store.getTotalWordCount(), 0);
  });

  it("should create a new project and set it as active project context", () => {
    const newProj = store.createProject({
      name: "Starfall Vanguard",
      genre: "Sci-Fi / Mecha",
      description: "A dying solar empire defends against deep-space anomalies.",
    });

    assert.ok(newProj.id);
    assert.equal(newProj.name, "Starfall Vanguard");
    assert.equal(store.getState().activeProjectId, newProj.id);
    assert.equal(store.getActiveProject()?.id, newProj.id);
    assert.equal(store.getState().projects.length, 1);
  });

  it("should create chapters and scenes for the active project", () => {
    store.createProject({
      name: "Celestial Dao",
      genre: "Xianxia",
      description: "Immortal path cultivation saga.",
    });

    const chap = store.createChapter("Chapter 1: The Awakening", "Introduction to cultivator");
    assert.ok(chap.id);
    assert.equal(chap.title, "Chapter 1: The Awakening");

    const scene = store.createScene(chap.id, "Scene 1: Spirit Spring", 1500);
    assert.ok(scene.id);
    assert.equal(scene.chapterId, chap.id);
    assert.equal(scene.targetWordCount, 1500);
    assert.equal(store.getState().scenes.length, 1);
  });

  it("should update scene prose content and accurately compute word counts", () => {
    store.createProject({
      name: "Celestial Dao",
      genre: "Xianxia",
    });

    const chap = store.createChapter("Chapter 1: The Awakening");
    const scene = store.createScene(chap.id, "Scene 1: Spirit Spring", 1000);

    const proseSample = "Engines ignited with a brilliant crimson roar as the thrusters cleared orbit.";
    store.updateSceneContent(scene.id, proseSample);

    const updated = store.getActiveScene();
    assert.equal(updated?.id, scene.id);
    assert.equal(updated?.proseContent, proseSample);
    assert.equal(updated?.wordCount, 12);
    assert.equal(store.getTotalWordCount(), 12);
  });

  it("should create blueprints, instantiate entities, and evaluate AST dynamic formulas", () => {
    store.createProject({
      name: "Celestial Dao",
      genre: "Xianxia",
    });

    // Create 1st-Class Blueprint
    const cultivatorBp = store.createBlueprint({
      name: "Cultivator Archetype",
      category: "Characters",
      blueprintClass: "FIRST_CLASS",
      description: "Daoist martial cultivator",
      fields: [
        {
          id: "f_base_qi",
          name: "Base Qi",
          key: "base_qi",
          fieldType: "NUMBER",
          required: true,
          defaultValue: 100,
        },
        {
          id: "f_multiplier",
          name: "Qi Multiplier",
          key: "multiplier",
          fieldType: "NUMBER",
          required: true,
          defaultValue: 3,
        },
        {
          id: "f_effective_power",
          name: "Effective Power",
          key: "effective_power",
          fieldType: "FORMULA",
          formulaExpression: "base_qi * multiplier + 50",
        },
      ],
    });

    assert.ok(cultivatorBp.id);
    assert.equal(cultivatorBp.blueprintClass, "FIRST_CLASS");

    // Instantiate Entity
    const entity = store.createEntity({
      name: "Eldrin Stormweaver",
      blueprintId: cultivatorBp.id,
      category: "Characters",
      description: "Master of thunder arts",
      properties: {
        base_qi: 200,
        multiplier: 4,
        status: "ALIVE",
      },
    });

    assert.ok(entity.id);
    assert.equal(entity.name, "Eldrin Stormweaver");
    assert.equal(entity.properties.base_qi, 200);

    // Evaluate formula
    const evals = store.evaluateEntityFormulas(entity.id);
    // formula: 200 * 4 + 50 = 850
    assert.equal(evals["effective_power"], 850);
  });

  it("should manage causal timeline delta events and calculate time-travel state folds", () => {
    store.createProject({
      name: "Celestial Dao",
      genre: "Xianxia",
    });

    const ev1 = store.addTimelineEvent({
      title: "Discovery of Spirit Spring",
      narrativeSequenceNumber: 10,
      chronologicalOrder: 10,
      description: "Discovers the spring in the secluded valley.",
    });

    const ev2 = store.addTimelineEvent({
      title: "Breakthrough to Core Formation",
      narrativeSequenceNumber: 20,
      chronologicalOrder: 50,
      description: "Undergoes heavenly tribulation.",
    });

    assert.ok(ev1.id);
    assert.ok(ev2.id);

    const events = store.getTimelineEvents();
    assert.equal(events.length, 2);

    // Test time travel folds
    const foldedNarrative = store.getFoldedEntitiesAtSequence(15, "narrative");
    assert.ok(Array.isArray(foldedNarrative));
  });

  it("should create and toggle invariant rules, run continuity audits, and execute overrides", () => {
    store.createProject({
      name: "Celestial Dao",
      genre: "Xianxia",
    });

    const rule = store.addRule({
      name: "Dead Entities Cannot Battle",
      severity: "BLOCKING_ERROR",
      type: "STATE_GUARD",
      predicateExpression: "entity.status != 'DEAD'",
      description: "Fallen characters cannot engage in active combat.",
    });

    assert.ok(rule.id);
    assert.equal(rule.enabled, true);

    store.toggleRule(rule.id);
    const updatedRule = store.getRules().find((r) => r.id === rule.id);
    assert.equal(updatedRule?.enabled, false);

    // Run audit
    store.runContinuityAudit();
    const violations = store.getViolations();
    assert.ok(Array.isArray(violations));
  });

  it("should accurately evaluate complex formula AST expressions", () => {
    const context = {
      base_power: 100,
      gear_bonus: 50,
      affinity: 1.5,
      resistance: 20,
    };

    const res1 = evaluateFormula("(base_power + gear_bonus) * affinity - resistance", context);
    // (100 + 50) * 1.5 - 20 = 150 * 1.5 - 20 = 225 - 20 = 205
    assert.equal(res1.value, 205);

    const res2 = evaluateFormula("max(base_power, 500)", context);
    assert.equal(res2.value, 500);

    const res3 = evaluateFormula("clamp(base_power * affinity, 0, 120)", context);
    // 100 * 1.5 = 150 -> clamped to 120
    assert.equal(res3.value, 120);
  });
});




