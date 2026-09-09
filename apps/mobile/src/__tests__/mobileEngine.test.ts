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
});
