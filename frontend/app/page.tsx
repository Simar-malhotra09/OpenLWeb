"use client";
import { useEffect, useState, useMemo, useCallback} from "react";
import "./styles/home.css";
import dynamic from 'next/dynamic';
import SpriteText from "three-spritetext";

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

import { useRef, MutableRefObject } from "react";

import TagTreeSitter from "../components/tag-treesitter.tsx";
import {getPaperData}from "./lib/utils/additional-node-info.ts";
import type {WhitePaper}from "./lib/utils/additional-node-info.ts";
import { inferDocType ,DocTypeInfo } from "./lib/utils/infer-value-type.tsx";



interface Node {
  id: string;
  user: string;
  title: string;
  link?: string;
  type: string;
  val?: number;
  x:number;
  y:number;
  z:number;
  
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

// Enhanced color palette
const COLORS = {
  background: '#0a0a0f',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  warning: '#f59e0b',
  danger: '#ef4444',
  success: '#10b981',
  text: '#e2e8f0',
  textMuted: '#64748b',
  surface: '#1e293b',
  border: '#334155'
};

const NODE_COLORS = [
  COLORS.primary, COLORS.secondary, COLORS.accent, 
  COLORS.success, COLORS.warning, '#ec4899', '#14b8a6', '#f97316'
];

// Constants
const NODE_SIZE = 8;
const LINK_OPACITY = 0.7;
const PARTICLE_SPEED = 0.006;

export default function EnhancedForceGraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [paperInfo, setPaperInfo] = useState<WhitePaper | null>(null);
  const [loadingPaperInfo, setLoadingPaperInfo] = useState(false);
  const [paperError, setPaperError] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
 const graphRef: MutableRefObject<any> = useRef(null);


  // Memoized color functions
  const getNodeColor = useMemo(() => {
    return (node: Node) => {
      if (node.type === "[TAG]") return COLORS.danger;
      const userHash = node.user.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return NODE_COLORS[Math.abs(userHash) % NODE_COLORS.length];
    };
  }, []);

  const getLinkColor = useMemo(() => {
    return (link:Link) => link.type === "[TAG]" ? COLORS.danger : COLORS.accent;
  }, []);

  const getParticleColor = useMemo(() => {
    return (link: Link) => link.type === "[TAG]" ? COLORS.danger : COLORS.primary;
  }, []);

  const processedGraphData = useMemo(() => {
    if (!graphData) return null;
    
    // Calculate node connections for sizing
    const connectionCounts = new Map<string, number>();
    graphData.links.forEach(link => {
      connectionCounts.set(link.source.toString(), (connectionCounts.get(link.source.toString()) || 0) + 1);
      connectionCounts.set(link.target.toString(), (connectionCounts.get(link.target.toString()) || 0) + 1);
    });

    return {
      ...graphData,
      nodes: graphData.nodes.map(node => ({
        ...node,
        val: Math.max(3, (connectionCounts.get(node.id) || 1) * 2)
      }))
    };
  }, [graphData]);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/get-graph-json", { 
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          }
        });


        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (!data.nodes || !data.links || !Array.isArray(data.nodes) || !Array.isArray(data.links)) {
          throw new Error("Invalid graph data format: missing or invalid nodes/links arrays");
        }

        if (data.nodes.length === 0) {
          throw new Error("No nodes found in the dataset");
        }

        setGraphData(data);
        setError(null);

      } catch (err: unknown) {
        console.error("Error fetching graph data:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load graph data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

    // get paper info
  const docType = useMemo(() => {
    if (!selectedNode?.link) return null;
    return inferDocType(selectedNode.link);
  }, [selectedNode?.link]);

  useEffect(() => {
    if (!selectedNode || !docType) {
      setPaperInfo(null);
      setPaperError(null);
      setLoadingPaperInfo(false);
      return;
    }

    if (selectedNode.link?.includes("arxiv")) {
      setLoadingPaperInfo(true);
      setPaperError(null);

      getPaperData(selectedNode.link)
        .then((info) => {
          setPaperInfo(info);
          setLoadingPaperInfo(false);
        })
        .catch((err) => {
          setPaperError(err.message || "Failed to load paper info");
          setLoadingPaperInfo(false);
        });
    } else {
      // Clear paper info if not an arXiv link
      setPaperInfo(null);
      setLoadingPaperInfo(false);
      setPaperError(null);
    }
  }, [selectedNode, docType]);


  const goToNode = useCallback((node: Node) => {
    console.log("goToNode called with:", node.id);
    
    if (!graphRef.current || !processedGraphData) {
      console.error("Graph ref or processed data not available");
      return;
    }

    const targetNode = processedGraphData.nodes.find((n: Node) => n.id === node.id);
    
    if (!targetNode) {
      console.error("Node not found in graph data");
      return;
    }

    setSelectedNode(targetNode);

    const attemptNavigation = (attempts = 0) => {
      const maxAttempts = 15; // Increased attempts
      
      if (attempts >= maxAttempts) {
        console.error("Failed to navigate after", maxAttempts, "attempts");
        return;
      }

      // check if the node has been positioned by the force simulation
      const currentNodes = graphRef.current?.scene?.children;
      let foundPositionedNode = null;

      try {
        if (typeof targetNode.x === "number" && 
            typeof targetNode.y === "number" && 
            typeof targetNode.z === "number" &&
            !isNaN(targetNode.x) && 
            !isNaN(targetNode.y) && 
            !isNaN(targetNode.z) &&
            (Math.abs(targetNode.x) > 0.001 || Math.abs(targetNode.y) > 0.001 || Math.abs(targetNode.z) > 0.001)) {
          
          foundPositionedNode = targetNode;
        }
        
        if (foundPositionedNode) {
          console.log(`Navigation successful on attempt ${attempts + 1}:`, {
            id: foundPositionedNode.id,
            coordinates: { 
              x: foundPositionedNode.x, 
              y: foundPositionedNode.y, 
              z: foundPositionedNode.z 
            }
          });
          
          const distance = 150; 
          const cameraX = foundPositionedNode.x + distance;
          const cameraY = foundPositionedNode.y + distance;  
          const cameraZ = foundPositionedNode.z + distance;

          // Navigate camera 
          try {
            graphRef.current.cameraPosition(
              { x: cameraX, y: cameraY, z: cameraZ },
              foundPositionedNode,
              1200 
            );
            console.log("Camera navigation initiated successfully");
          } catch (cameraError) {
            console.error("Camera positioning failed:", cameraError);
          }
        
          return;
        }
      } catch (error) {
        console.log(`Attempt ${attempts + 1} error:`, error);
      }

      // Node not positioned yet, retry after a delay
      console.log(`Attempt ${attempts + 1}: Node not positioned yet, retrying in ${50 + attempts * 25}ms...`);
      setTimeout(() => attemptNavigation(attempts + 1), 50 + attempts * 25);
    };

    // Start the navigation attempts
    attemptNavigation();
  }, [processedGraphData]);

  useEffect(() => {
    if (graphRef.current && processedGraphData) {
      // Give the graph some time to initialize and position nodes
      const initTimer = setTimeout(() => {
        console.log("Graph initialization period complete, ready for navigation");
      }, 2000);
      
      return () => clearTimeout(initTimer);
    }
  }, [processedGraphData]);

  const handleNodeClick = useCallback((node: Node) => {
      goToNode(node);
      console.log(node.id);
      console.log(
          "coordinates:",
          node.x,
          node.y,
          node.z
      );

  }, [goToNode]);

  const handleNodeRightClick = useCallback((node: Node) => {
    if (node.link) {
      window.open(node.link, "_blank", "noopener,noreferrer");
    }
  }, []);

  // const handleNodeDrag = useCallback((node: any) => {
  //   setDraggedNodeId(node.id); 
  // }, []);
  //
  // const handleNodeDragEnd = useCallback((node: any) => {
  //   setDraggedNodeId(null); 
  // }, []);


  const resetCamera = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x:50, y: 0, z: 300 }, { x: 0, y: 0, z: 0 }, 2000);
    }
  }, []);

  // Auto-hide controls after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  const [showTagTree, setShowTagTree] = useState(false);

  if (loading) {
    return (
      <div className="graph-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading graph data...</div>
          <div className="loading-subtext">Preparing nodes and connections</div>
        </div>
        <style jsx>{`
          .graph-container {
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, ${COLORS.background} 0%, #1a1a2e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .loading-container {
            text-align: center;
            color: ${COLORS.text};
          }
          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid ${COLORS.border};
            border-top: 3px solid ${COLORS.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          }
          .loading-text {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .loading-subtext {
            color: ${COLORS.textMuted};
            font-size: 14px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Failed to Load Graph</div>
          <div className="error-message">{error}</div>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <div className="app-header">
        <div className="app-logo">
          OpenLWeb
        </div>
        <div className="header-actions">
          <a 
            href="https://github.com/Simar-malhotra09/OpenLWeb" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-link"
            title="View on GitHub"
          >
            <img 
              src="/github-mark/github-mark-white.svg" 
              alt="GitHub Repository" 
            />
          </a>
        </div>
        
      </div>
      {processedGraphData && (
        <ForceGraph3D
          ref={graphRef}
          graphData={processedGraphData}

          onNodeDrag={(node: Node) => {
              setDraggedNodeId(node.id);
          }}
          onNodeDragEnd={() => {
              setDraggedNodeId(null);
          }}
        
          nodeOpacity={(node: Node) =>

            draggedNodeId === null || draggedNodeId === node.id ? 1 : 0.5
          }


          backgroundColor={COLORS.background}
          nodeLabel={(node: Node) => `
            <div style="
              background: rgba(15, 23, 42, 0.95);
              color: #e2e8f0;
              padding: 12px 16px;
              border-radius: 8px;
              border: 1px solid #334155;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 300px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            ">
              <div style="font-weight: 700; color: ${getNodeColor(node)}; margin-bottom: 4px;">${node.user}</div>
              <div style="font-size: 14px; line-height: 1.4;">${node.title}</div>
              ${node.type === "[TAG]" ? '<div style="color: #ef4444; font-size: 12px; margin-top: 4px;">🏷️ Tag</div>' : ''}
              ${node.link ? '<div style="color: #64748b; font-size: 12px; margin-top: 8px;">Right-click to open link</div>' : ''}
            </div>
          `}
          nodeColor={getNodeColor}
          nodeOpacity={0.5}
          nodeRelSize={NODE_SIZE}
          nodeVal={(node: Node) => node.val || 5}
          linkColor={getLinkColor}
          linkOpacity={LINK_OPACITY}
          linkWidth={1.5}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={PARTICLE_SPEED}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={getParticleColor}
          onNodeClick={handleNodeClick}
          onNodeRightClick={handleNodeRightClick}
          enableNodeDrag={true}
          enableNavigationControls={true}
          showNavInfo={false}
        />
      )}
      <div>
      </div>
      {/* Control Panel */}
      <div className={`controls-panel ${!showControls ? 'hidden' : ''}`}>
        <div className="control-item">
          <span className="control-label">🖱️ Left Click</span>
          <span className="control-desc">Focus node</span>
        </div>
        <div className="control-item">
          <span className="control-label">🖱️ Right Click</span>
          <span className="control-desc">Open link</span>
        </div>
        <div className="control-item">
          <span className="control-label">🖱️ Drag</span>
          <span className="control-desc">Move nodes</span>
        </div>
        <button className="reset-camera-btn" onClick={resetCamera}>
          🎯 Reset View
        </button>
      </div>

      {/* Toggle Controls Button */}
      <button 
        className="toggle-controls-btn"
        onClick={() => setShowControls(!showControls)}
      >
        {showControls ? '✕' : 'ℹ️'}
      </button>


      {/* Selected Node Info - add the conditional class */}
      {selectedNode && (
        <div className={`node-info-panel ${showTagTree ? 'avoid-overlap' : ''}`}>
          <div className="node-info-header">
            <button onClick={() => setSelectedNode(null)}>✕</button>
          </div>
          <div className="node-info-content">
            <p><strong>Title:</strong> {selectedNode.title}</p>
            
            {loadingPaperInfo && <p>Loading paper info...</p>}
            {paperError && <p className="text-red-500">{paperError}</p>}

            {paperInfo && (
              <>
                {console.log("Paper Info:", paperInfo)}
                <p><strong> Source:</strong> {paperInfo.dataSource}</p>
                <p><strong>Date:</strong> {paperInfo.date}</p>
                <p><strong>Authors:</strong> {paperInfo.author}</p>
                <p><strong>Publisher:</strong> {paperInfo.publisher || "No publisher available"}</p>
                <p><strong>Abstract:</strong> {paperInfo.abstract || "No abstract available."}</p>


              </>
            )}
            <p>
              <strong>Type:</strong>{" "}
              <span
                style={{
                  color: selectedNode.type === "[TAG]" ? "#ef4444" : "#10b981",
                }}
              >
                {selectedNode.type === "[TAG]" ? (
                  "🏷️ Tag"
                ) : (
                  <>
                  {docType?.icon} {docType.label}
                  </>
                )}
              </span>
            </p>
            
            {selectedNode.link && (
              <a 
                href={selectedNode.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="node-link"
              >
                🔗 Open Link
              </a>
            )}
          </div>
        </div>
      )}


      {/* Tag Tree - wrap in a container with toggle */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 900 }}>
        {!showTagTree ? (
          <button 
            onClick={() => setShowTagTree(true)}
            style={{
              background: 'rgba(99, 102, 241, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🌳 Show Tags
          </button>
        ) : (
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            width: '280px',
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'hidden'
          }}>
            <div 
              onClick={() => setShowTagTree(false)}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>🌳 Tag Hierarchy</span>
              <span>✕</span>
            </div>
            <div style={{ 
              padding: '20px',
              overflow: 'auto',
              maxHeight: 'calc(100vh - 380px)'
            }}>
              <TagTreeSitter graphData= {processedGraphData} onGoToNode={goToNode}/>
            </div>
          </div>
        )}
    </div>
    </div>
  );
}

