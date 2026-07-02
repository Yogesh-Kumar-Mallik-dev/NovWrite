import { BOX } from "./constants";

import { TreeNode } from "./types";

/* -------------------------------------------------------------------------- */
/*                              Tree Rendering                                */
/* -------------------------------------------------------------------------- */

function renderNode(
  node: TreeNode,
  prefix: string,
  isLast: boolean,
  lines: string[]
) {
  const branch = isLast
    ? BOX.BOTTOM_LEFT
    : BOX.T_LEFT;

  lines.push(
    `${prefix}${branch}─ ${node.label}`
  );

  if (!node.children?.length) {
    return;
  }

  const nextPrefix =
    prefix +
    (isLast
      ? "   "
      : `${BOX.VERTICAL}  `);

  node.children.forEach(
    (child, index) =>
      renderNode(
        child,
        nextPrefix,
        index ===
        node.children!.length - 1,
        lines
      )
  );
}

/* -------------------------------------------------------------------------- */
/*                              Public Renderer                               */
/* -------------------------------------------------------------------------- */

export function renderTree(
  root: TreeNode
) {
  const lines: string[] = [];

  lines.push(root.label);

  root.children?.forEach(
    (child, index) =>
      renderNode(
        child,
        "",
        index ===
        root.children!.length - 1,
        lines
      )
  );

  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/*                              Builder Helpers                               */
/* -------------------------------------------------------------------------- */

export function createTree(
  label: string
): TreeNode {
  return {
    label,
    children: [],
  };
}

export function addNode(
  parent: TreeNode,
  label: string
) {
  const node: TreeNode = {
    label,
    children: [],
  };

  parent.children ??= [];

  parent.children.push(node);

  return node;
}

export function leaf(
  label: string
): TreeNode {
  return {
    label,
  };
}
