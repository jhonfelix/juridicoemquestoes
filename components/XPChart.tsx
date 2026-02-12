import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface XPChartProps {
  currentXP: number;
  nextLevelXP: number;
  prevLevelXP: number;
}

const XPChart: React.FC<XPChartProps> = ({ currentXP, nextLevelXP, prevLevelXP }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevXPRef = useRef(currentXP); // Track previous XP to trigger animation

  useEffect(() => {
    if (!svgRef.current) return;

    // Detect if XP increased
    const isIncreasing = currentXP > prevXPRef.current;

    // Fixed internal coordinate system
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius - 15;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Scale
    const progress = Math.max(0, Math.min(1, (currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)));
    
    // Background Arc
    const bgArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    svg.append("path")
      .attr("d", bgArc as any)
      .attr("fill", "#1e293b"); // jur-blue-800

    // Foreground Arc
    const fgArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI * progress)
      .cornerRadius(10);

    svg.append("path")
      .attr("d", fgArc as any)
      .attr("fill", "#fbbf24"); // jur-gold-400

    // Text Label: "XP ATUAL"
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.8em")
      .text("XP ATUAL")
      .attr("font-size", "12px")
      .attr("fill", "#94a3b8");

    // Text Label: Value (The one to animate)
    const valueText = svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.6em")
      .text(`${currentXP}`)
      .attr("font-size", "28px")
      .attr("font-weight", "bold")
      .attr("fill", "white");

    if (isIncreasing) {
      // Animation: Pop/Pulse and Color Flash
      valueText
        .attr("fill", "#fbbf24") // Flash Gold
        .attr("font-size", "36px") // Jump size
        .transition()
        .duration(800)
        .ease(d3.easeElasticOut) // Bounce back
        .attr("font-size", "28px")
        .attr("fill", "white");
    }
      
    // Text Label: Denominator
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2.2em")
      .text(`/ ${nextLevelXP}`)
      .attr("font-size", "16px") 
      .attr("font-weight", "600")
      .attr("fill", "#cbd5e1"); 

    // Update ref for next render
    prevXPRef.current = currentXP;

  }, [currentXP, nextLevelXP, prevLevelXP]);

  return <svg ref={svgRef} className="w-full h-full"></svg>;
};

export default XPChart;