import test from "node:test";
import assert from "node:assert/strict";

import {
  addNode,
  createTree,
  leaf,
  renderTree,
} from "@/lib/logger/tree";




/* -------------------------------------------------------------------------- */
/*                               createTree                                   */
/* -------------------------------------------------------------------------- */

test("createTree creates an empty root node", () => {
  assert.deepEqual(
    createTree("Root"),
    {
      label: "Root",
      children: [],
    }
  );
});

/* -------------------------------------------------------------------------- */
/*                                  leaf                                      */
/* -------------------------------------------------------------------------- */

test("leaf creates a leaf node", () => {
  assert.deepEqual(
    leaf("Character"),
    {
      label: "Character",
    }
  );
});

/* -------------------------------------------------------------------------- */
/*                                addNode                                     */
/* -------------------------------------------------------------------------- */

test("addNode appends child to parent", () => {
  const root = createTree("Root");

  const child = addNode(
    root,
    "Characters"
  );

  assert.equal(
    root.children?.length,
    1
  );

  assert.equal(
    root.children?.[0],
    child
  );

  assert.deepEqual(child, {
    label: "Characters",
    children: [],
  });
});

test("addNode initializes children array when absent", () => {
  const parent: {
    label: string;
    children?: ReturnType<typeof leaf>[];
  } = {
    label: "Root",
  };

  addNode(
    parent,
    "Child"
  );

  assert.equal(
    parent.children?.length,
    1
  );
});

/* -------------------------------------------------------------------------- */
/*                               renderTree                                   */
/* -------------------------------------------------------------------------- */

test("renderTree renders root only", () => {
  const root = createTree("API");

  assert.equal(
    renderTree(root),
    "API"
  );
});

test("renderTree renders one child", () => {
  const root = createTree("API");

  addNode(
    root,
    "Characters"
  );

  assert.equal(
    renderTree(root),
    `API
╰─ Characters`
  );
});

test("renderTree renders multiple children", () => {
  const root = createTree("API");

  addNode(
    root,
    "Characters"
  );

  addNode(
    root,
    "Items"
  );

  assert.equal(
    renderTree(root),
    `API
├─ Characters
╰─ Items`
  );
});

test("renderTree renders nested tree", () => {
  const root = createTree("API");

  const characters =
    addNode(
      root,
      "Characters"
    );

  addNode(
    characters,
    "Xiao Yan"
  );

  addNode(
    characters,
    "Lin Ming"
  );

  addNode(
    root,
    "Items"
  );

  assert.equal(
    renderTree(root),
    `API
├─ Characters
│  ├─ Xiao Yan
│  ╰─ Lin Ming
╰─ Items`
  );
});

test("renderTree renders leaf nodes", () => {
  const root = createTree("API");

  root.children?.push(
    leaf("Status")
  );

  assert.equal(
    renderTree(root),
    `API
╰─ Status`
  );
});
