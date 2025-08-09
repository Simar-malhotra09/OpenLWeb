"use client";
import { useState, useEffect } from "react";

interface Node {
  id: string;
  user: string;
  title: string;
  link?: string;
  type: string;
  val?: number;
  x: number;
  y: number;
  z: number;
}

interface Link {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface TreeNode {
  node: Node;
  children: TreeNode[];
  depth: number;
  root?: boolean;
}

export default function TagTreeSitter() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
          const res = await fetch("/api/get_data_from_endpoint", { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          }
          });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        if (!Array.isArray(data.nodes))
          throw new Error("Invalid graph data format");
        setGraphData(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load graph data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchGraphData();
  }, []);

  // ✅ New hierarchy builder — works purely from tag titles
  const buildTagHierarchyFromTitles = (tagTitles: string[]): TreeNode[] => {
    type TempNode = { title: string; children: Record<string, TempNode> };
    const root: Record<string, TempNode> = {};

    for (const fullTag of tagTitles) {
      const parts = fullTag.split("/");
      let current = root;
      for (const part of parts) {
        if (!current[part]) {
          current[part] = { title: part, children: {} };
        }
        current = current[part].children;
      }
    }

    const convert = (
      nodeMap: Record<string, TempNode>,
      depth = 0
    ): TreeNode[] => {
      return Object.values(nodeMap)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((node) => ({
          node: { id: `${depth}-${node.title}`, title: node.title, type: "[TAG]" },
          depth,
          children: convert(node.children, depth + 1),
        }));
    };

    return convert(root, 0);
  };

  // Recursive component for rendering
  const TreeNodeComponent = ({
    treeNode,
    isRoot = false,
  }: {
    treeNode: TreeNode;
    isRoot?: boolean;
  }) => {
    const hasChildren = treeNode.children.length > 0;
    const isCollapsed = collapsed[treeNode.node.id];

    const handleToggle = () => {
      if (hasChildren) {
        setCollapsed((prev) => ({
          ...prev,
          [treeNode.node.id]: !prev[treeNode.node.id],
        }));
      }
    };

    const getIndentationClass = (depth: number) => {
      const indentMap: Record<number, string> = {
        0: "",
        1: "ml-6",
        2: "ml-12",
        3: "ml-18",
        4: "ml-24",
      };
      return indentMap[Math.min(depth, 4)] || "ml-24";
    };
    const indentStyle = { marginLeft: `${treeNode.depth * 12}px` };

    return (
      <div>
        <div
          className="flex items-center text-sm cursor-pointer select-none"
          style={indentStyle}
          onClick={handleToggle}
        >
          {hasChildren ? (
            <span className="mr-1 text-gray-400">
              {isCollapsed ? "▶" : "▼"}
            </span>
          ) : (
            <span className="mr-1 text-transparent">•</span>
          )}
          <span
            className={
              treeNode.depth === 0
                ? "text-purple-400 font-semibold"
                : "text-gray-300"
            }
          >

          {hasChildren
            ? treeNode.node.title
            : `-${treeNode.node.title}`
          }

          </span>
        </div>

        {hasChildren && !isCollapsed && (
          <div>
            {treeNode.children.map((child) => (
              <TreeNodeComponent key={child.node.id} treeNode={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading tags...</div>;
  }
  if (error) {
    return <div className="text-red-400 text-sm">Error: {error}</div>;
  }
  if (!graphData) return null;

  const tagTitles = graphData.nodes
    .filter((n) => n.type === "[TAG]")
    .map((n) => n.title);

  const tagHierarchy = buildTagHierarchyFromTitles(tagTitles);
  return (
    <div className="text-xs font-mono bg-transparent text-white">
      {tagHierarchy.map((rootNode) => (
        <TreeNodeComponent key={rootNode.node.id} treeNode={rootNode} />
      ))}
    </div>
  );
}
