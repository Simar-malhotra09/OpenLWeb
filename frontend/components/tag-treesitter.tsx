"use client";
import { useState } from "react";

interface Node {
  id: string;
  user: string;
  title: string;
  link?: string;
  type: string;
  val?: number;
  x?: number;
  y?: number;
  z?: number;
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
  node: Node | null;
  children: TreeNode[];
  depth: number;
  title: string;
}

type Props = {
  graphData: GraphData | null;
  onGoToNode?: (node: Node) => void;
};

export default function TagTreeSitter({ graphData, onGoToNode }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!graphData) return <div>No graph data available</div>;

  const buildTagHierarchyFromTitles = (tagNodes: Node[]): TreeNode[] => {
    type TempNode = { 
      title: string; 
      node?: Node;
      children: Record<string, TempNode> 
    };
    
    const root: Record<string, TempNode> = {};

    for (const node of tagNodes) {
      const parts = node.title.split("/");
      let current = root;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = { title: part, children: {} };
        }
        
        if (index === parts.length - 1) {
          current[part].node = node;
        }
        
        current = current[part].children;
      });
    }

    const convert = (nodeMap: Record<string, TempNode>, depth = 0): TreeNode[] =>
      Object.values(nodeMap).map((tempNode) => ({
        node: tempNode.node || null,
        title: tempNode.title,
        depth,
        children: convert(tempNode.children, depth + 1),
      }));

    return convert(root, 0);
  };

  const TreeNodeComponent = ({ treeNode, path = "" }: { treeNode: TreeNode; path?: string }) => {
    const hasChildren = treeNode.children.length > 0;
    const nodeKey = `${path}/${treeNode.title}`;
    const isCollapsed = collapsed[nodeKey];
    const isActualNode = treeNode.node !== null;

    const handleToggle = () => {
      if (hasChildren) {
        setCollapsed((prev) => ({
          ...prev,
          [nodeKey]: !prev[nodeKey],
        }));
      }
    };

    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      
      if (isActualNode && treeNode.node && onGoToNode) {
        // Just pass the node - let the parent component handle the navigation
        // The parent has access to the graph ref and can find the positioned node
        console.log("Requesting navigation to tag:", treeNode.node.id);
        onGoToNode(treeNode.node);
      }
    };

    return (
      <div>
        <div
          style={{ 
            marginLeft: `${treeNode.depth * 16}px`,
            padding: '4px 8px',
            cursor: isActualNode ? 'pointer' : hasChildren ? 'pointer' : 'default',
            borderRadius: '4px',
            color: isActualNode ? '#ef4444' : '#e2e8f0',
            fontSize: '14px',
            fontWeight: isActualNode ? '600' : '400',
            transition: 'all 0.2s ease',
          }}
          onClick={handleToggle}
          onContextMenu={handleRightClick}
          onMouseEnter={(e) => {
            if (isActualNode) {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={isActualNode ? "Right-click to navigate to this tag" : ""}
        >
          <span style={{ marginRight: '8px', opacity: 0.7 }}>
            {hasChildren ? (isCollapsed ? "▶" : "▼") : isActualNode ? "🏷️" : "•"}
          </span>
          {treeNode.title}
        </div>
        
        {hasChildren && !isCollapsed && (
          <div>
            {treeNode.children.map((child, index) => (
              <TreeNodeComponent 
                key={`${nodeKey}/${child.title}/${index}`} 
                treeNode={child} 
                path={nodeKey}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const tagNodes = graphData.nodes.filter((n) => n.type === "[TAG]");
  const tagHierarchy = buildTagHierarchyFromTitles(tagNodes);

  if (tagNodes.length === 0) {
    return (
      <div style={{ color: '#64748b', fontStyle: 'italic' }}>
        No tags found in the graph
      </div>
    );
  }

  return (
    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
      <div style={{ 
        marginBottom: '12px', 
        color: '#64748b', 
        fontSize: '12px',
        fontStyle: 'italic' 
      }}>
        Right-click on tags to navigate
      </div>
      {tagHierarchy.map((rootNode, index) => (
        <TreeNodeComponent 
          key={`root-${rootNode.title}-${index}`} 
          treeNode={rootNode} 
          path=""
        />
      ))}
    </div>
  );
}
