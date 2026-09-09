/**
 * @file mobileEngine.test.ts
 * @description Unit tests for Mobile client state management, project switching, and prose drafting telemetry.
 * Block Standard: BLOCK_TEST_MOBILE_ENGINE_001
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MobileStore } from "../lib/mobileStore.ts";

describe("BLOCK_TEST_MOBILE_ENGINE_001: Mobile Client Store and Telemetry Engine", () => {
  let store: MobileStore;

  beforeEach(() => {
    store = new MobileStore();
  });

  it("should initialize with demo project and calculate initial word counts", () => {
    const activeProject = store.getActiveProject();
    assert.ok(activeProject);
    assert.equal(activeProject.name, "Chronicles of the Celestial Dao");

    const totalWords = store.getTotalWordCount();
    assert.equal(totalWords > 0, true);
  });

  it("should create a new project and switch active project context", () => {
    const newProj = store.createProject({
      name: "Starfall Vanguard",
      genre: "Sci-Fi / Mecha",
      description: "A dying solar empire defends against deep-space anomalies.",
    });

    assert.equal(newProj.name, "Starfall Vanguard");
    assert.equal(store.getState().activeProjectId, newProj.id);
    assert.equal(store.getActiveProject()?.id, newProj.id);
  });

  it("should create chapters and scenes for the active project", () => {
    const chap = store.createChapter("Chapter 1: The Awakening", "Introduction to mecha pilot");
    assert.ok(chap.id);
    assert.equal(chap.title, "Chapter 1: The Awakening");

    const scene = store.createScene(chap.id, "Scene 1: Cockpit Pre-flight", 1200);
    assert.ok(scene.id);
    assert.equal(scene.chapterId, chap.id);
    assert.equal(scene.targetWordCount, 1200);
  });

  it("should update scene prose content and accurately compute word count increments", () => {
    const activeScene = store.getActiveScene();
    assert.ok(activeScene);

    const proseSample = "Engines ignited with a brilliant crimson roar as the thrusters cleared orbit.";
    store.updateSceneContent(activeScene.id, proseSample);

    const updated = store.getActiveScene();
    assert.equal(updated?.proseContent, proseSample);
    assert.equal(updated?.wordCount, 12);
  });

  it("should initialize default blueprints, entities, and support entity creation", () => {
    const blueprints = store.getBlueprints();
    assert.ok(blueprints.length >= 3);
    const cultivatorBp = blueprints.find((b) => b.id === "bp-cultivator");
    assert.ok(cultivatorBp);
    assert.equal(cultivatorBp?.blueprintClass, "FIRST_CLASS");

    const entities = store.getEntities();
    assert.ok(entities.length >= 2);
    const eldrin = entities.find((e) => e.id === "ent-eldrin");
    assert.ok(eldrin);
    assert.equal(eldrin?.name, "Eldrin Stormweaver");
    assert.equal(eldrin?.properties.realm, "Foundation Establishment");

    // Create a new entity with dynamic properties
    const newEnt = store.createEntity({
      name: "Grand Elder Zhang",
      blueprintId: "bp-cultivator",
      description: "Supreme elder of the Azure Cloud Sect",
      properties: {
        realm: "Nascent Soul",
        qi_power: 9500,
        faction: "Azure Cloud Sect",
        status: "ALIVE",
      },
    });

    assert.ok(newEnt.id);
    assert.equal(newEnt.name, "Grand Elder Zhang");
    assert.equal(newEnt.properties.realm, "Nascent Soul");
    const updatedEntities = store.getEntities();
    assert.equal(updatedEntities.some((e) => e.id === newEnt.id), true);
  });

  it("should manage causal timeline events and track sequence numbers", () => {
    const initialEvents = store.getTimelineEvents();
    assert.ok(initialEvents.length >= 3);

    const newEvent = store.createTimelineEvent({
      title: "Discovery of Ancient Lightning Scripture",
      description: "Eldrin stumbles upon a forgotten cave during his sect trials.",
      eventType: "CANON_MUTATION",
      entityName: "Eldrin Stormweaver",
      entityId: "ent-eldrin",
      timestamp: "Year of the Dragon 1045",
    });

    assert.ok(newEvent.id);
    assert.equal(newEvent.title, "Discovery of Ancient Lightning Scripture");
    const allEvents = store.getTimelineEvents();
    assert.equal(allEvents.some((e) => e.id === newEvent.id), true);
  });

  it("should toggle invariant rules and report continuity audit issues", () => {
    const rules = store.getInvariantRules();
    assert.ok(rules.length >= 2);
    const firstRule = rules[0];
    const initialActive = firstRule.isActive;

    store.toggleRule(firstRule.id);
    const updatedRule = store.getInvariantRules().find((r) => r.id === firstRule.id);
    assert.equal(updatedRule?.isActive, !initialActive);

    const issues = store.getContinuityIssues();
    assert.ok(issues.length >= 1);
    assert.equal(issues[0].severity, "ERROR");
    assert.equal(issues[0].code, "INVARIANT_STATE_ILLEGAL_ACTION");
  });
});




