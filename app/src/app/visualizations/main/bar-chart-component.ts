// libraries
import * as d3 from "d3";
import $ from "jquery";
// local
import { BarChartConfig } from "src/app/models/viz";
import { sequentialColorRange, SessionPage } from "src/app/models/config";
import { UtilsService } from "src/app/services/utils.service";
import { ChatService } from "src/app/services/socket.service";

export class BarChart {
  barChartConfig;
  plotWidth: number;
  plotHeight: number;
  plotGroup;

  constructor(
    public utilsService: UtilsService,
    public chatService: ChatService,
    public global: SessionPage,
    public userConfig,
    public appConfig
  ) {
    this.barChartConfig = new BarChartConfig();
  }

  /**
   * Create variables needed to draw and update plot.
   */
  initialize() {
    let context = this;
    const container = "#plot_container";
    const width = $(container).parent().width();
    const height = $(container).parent().height();
    const plotMargins = { top: 50, bottom: 50, left: 60, right: 30 };

    context.plotWidth = width - plotMargins.left - plotMargins.right;
    context.plotHeight = height - plotMargins.top - plotMargins.bottom;

    $(container).empty();

    // Add containing SVG
    let svg = d3.select(container).append("svg").attr("width", width).attr("height", height);

    // Add linear gradient to SVG definition for use in color scale FIRST
    let grad = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "grad")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
    grad
      .selectAll("stop")
      .data(sequentialColorRange)
      .enter()
      .append("stop")
      .style("stop-color", (d) => d.toString())
      .attr("offset", (_, i) => 100 * (i / (sequentialColorRange.length - 1)) + "%");

    // Add plot group
    context.plotGroup = svg
      .append("g")
      .classed("plot", true)
      .attr("transform", `translate(${plotMargins.left},${plotMargins.top})`);

    // Add X and Y axis groups
    context.barChartConfig.yAxisGroup = context.plotGroup.append("g").classed("y", true).classed("axis", true);
    context.barChartConfig.xAxisGroup = context.plotGroup
      .append("g")
      .classed("x", true)
      .classed("axis", true)
      .attr("transform", `translate(${0},${context.plotHeight})`);

    // Add bar groups
    context.barChartConfig.barsGroup = context.plotGroup.append("g").classed("bars", true);

    // Add legend group (empty for now)
    context.barChartConfig.legendGroup = context.plotGroup.append("g").classed("legend", true);

    // Create unsupported text to display if chart cannot render
    context.barChartConfig.unsupportedMessage = `
      <tspan>If using
        categorical (<tspan style="font-family: 'Font Awesome 5 Free'; font-weight: 800 !important">&#xf031;</tspan>)
        and/or
        temporal (<tspan style="font-family: 'Font Awesome 5 Free'; font-weight: 800 !important">&#xf133;</tspan>)
      </tspan>
      <tspan x="0" dy="1.2em">
        attributes, you must have 
        <tspan style="font-weight: 800 !important">only one</tspan>!
      </tspan>`;
  }

  /**
   * Calculate new values and re-draw plot.
   */
  update() {
    let context = this;
    let utils = context.utilsService;
    let originalDatasetDict = context.userConfig["originalDatasetDict"];
    let dataset = context.appConfig[context.global.appMode];

    // if there's no dataset don't update the bar chart
    if (!originalDatasetDict) return;

    // Clear ALL existing content first to ensure clean redraw
    context.barChartConfig.barsGroup.selectAll("*").remove();
    context.barChartConfig.legendGroup.selectAll("*").remove();

    // create raw data object
    let rawData = Object.keys(originalDatasetDict).map((id) => {
      return {
        ...originalDatasetDict[id],
        xVar: dataset["xVar"] == null ? null : originalDatasetDict[id][dataset["xVar"]],
        yVar: dataset["yVar"] == null ? null : originalDatasetDict[id][dataset["yVar"]],
      };
    });

    // filter raw data into a prepared data set
    let prepared = rawData;
    ["N", "O"].forEach((dataType) =>
      dataset.attributeDatatypeList[dataType].forEach((attr) => {
        let filterModel = dataset["attributes"][attr]["filterModel"];
        prepared = prepared.filter((item) => {
          return filterModel.indexOf(item[attr]) !== -1;
        });
      })
    );
    ["Q", "T"].forEach((dataType) =>
      dataset.attributeDatatypeList[dataType].forEach((attr) => {
        let filterModel = dataset["attributes"][attr]["filterModel"];
        prepared = prepared.filter((item) => {
          return (
            parseFloat(item[attr]) >= parseFloat(filterModel[0]) && parseFloat(item[attr]) <= parseFloat(filterModel[1])
          );
        });
      })
    );

    // Create buckets, scales and axes based on xy data types
    let buckets = []; // list of label-value pairs: [[label, value], ...]
    let horizontal = false;
    let xAxisTitle = "";
    let yAxisTitle = "";
    
    // Get aggregation type from dataset - ensure it's properly handled
    let aggType = dataset["aggType"];
    if (!aggType || aggType === null || aggType === undefined) {
      aggType = "count"; // Default fallback
    }
    
    
    let aggTitle = "";
    if (context.userConfig["aggregationMapping"] && context.userConfig["aggregationMapping"][aggType]) {
      aggTitle = context.userConfig["aggregationMapping"][aggType].toUpperCase();
    } else {
      aggTitle = aggType.toUpperCase();
    }
    
 
    
    let xScale = context.barChartConfig.xScale;
    let xAxis = context.barChartConfig.xAxis;
    let yScale = context.barChartConfig.yScale;
    let yAxis = context.barChartConfig.yAxis;
    let xIsQ = utils.isMeasure(dataset, dataset["xVar"], "Q");
    let yIsQ = utils.isMeasure(dataset, dataset["yVar"], "Q");



    // Check if we should create a grouped bar chart (both variables are categorical)
    let shouldCreateGroupedBar = dataset["xVar"] && dataset["yVar"] && !xIsQ && !yIsQ;

    console.log("Bar chart debugging:", {
      xVar: dataset["xVar"],
      yVar: dataset["yVar"],
      xIsQ: xIsQ,
      yIsQ: yIsQ,
      shouldCreateGroupedBar: shouldCreateGroupedBar
    });

    if (shouldCreateGroupedBar) {
      // Create grouped bar chart
      this.createGroupedBarChart(context, prepared, dataset, utils);
      return;
    }

    if (dataset["yVar"] == null) {
      // yVar is NA => Vertical histogram
      xScale = d3.scaleBand().range([0, context.plotWidth]).padding(0.1);
      xAxis = d3.axisBottom(xScale);
      if (xIsQ) {
        // [Q x NA] => Vertical binned histogram of count
        context.barChartConfig.legendGroup.style("display", "block");
        const bins = d3.bin().value((d) => +d["xVar"])(prepared);
        buckets = bins.map((bin) => {
          const lb = utils.formatLargeNum(+bin.x0); // lowerbound
          const ub = utils.formatLargeNum(+bin.x1); // upperbound
          const val = utils.aggregate(bin, "count", "xVar");
          return [`[${lb}, ${ub})`, val, bin];
        });
        xAxis.tickFormat((_, i) => buckets[i] ? buckets[i][0] : "");
        xAxisTitle = dataset["xVar"];
        yAxisTitle = `COUNT(${dataset["xVar"]})`;
      } else if (dataset["xVar"] !== null) {
        // [N/O/T x NA] => Vertical histogram of count
        context.barChartConfig.legendGroup.style("display", "block");
        buckets = d3
          .rollups(
            prepared,
            (v) => utils.aggregate(v, "count", "xVar"),
            (d) => d["xVar"]
          )
          .sort(function (x, y) {
            return d3.ascending(x[0], y[0]); // sort buckets
          });
        buckets.forEach((d) => d.push(prepared.filter((obj) => obj["xVar"] == d[0])));
        xAxis.tickFormat((_, i) => buckets[i] ? `${buckets[i][0]}` : "");
        xAxisTitle = dataset["xVar"];
        yAxisTitle = `COUNT(${dataset["xVar"]})`;
      } else {
        // [NA x NA] => unsupported
        context.barChartConfig.legendGroup.style("display", "none");
        context.barChartConfig.barsGroup
          .append("text")
          .attr("class", "unsupported-text")
          .attr("transform", `translate(${context.plotWidth / 2},${context.plotHeight / 2})`)
          .attr("text-anchor", "middle")
          .html(context.barChartConfig.unsupportedMessage);
        return;
      }
      xScale.domain(d3.range(buckets.length));
      yScale = d3.scaleLinear().range([context.plotHeight, 0]);
      
      // Handle Y-axis range properly based on value distribution
      let minVal = d3.min(buckets, (d) => d[1]) || 0;
      let maxVal = d3.max(buckets, (d) => d[1]) || 0;
      
      if (minVal >= 0) {
        yScale.domain([0, maxVal]).nice();
      } else if (maxVal <= 0) {
        yScale.domain([minVal, 0]).nice();
      } else {
        yScale.domain([minVal, maxVal]).nice();
      }
      
      yAxis = d3.axisLeft(yScale).tickFormat((d) => utils.formatLargeNum(+d));
    } else if (dataset["xVar"] == null) {
      // xVar is NA => Horizontal histogram
      horizontal = true;
      yScale = d3.scaleBand().range([0, context.plotHeight]).padding(0.1);
      yAxis = d3.axisLeft(yScale);
      if (yIsQ) {
        // [NA x Q] => Horizontal binned histogram of count
        context.barChartConfig.legendGroup.style("display", "block");
        const bins = d3.bin().value((d) => +d["yVar"])(prepared);
        buckets = bins
          .map((bin) => {
            const lb = utils.formatLargeNum(+bin.x0); // lowerbound
            const ub = utils.formatLargeNum(+bin.x1); // upperbound
            const val = utils.aggregate(bin, "count", "yVar");
            return [`[${lb}, ${ub})`, val, bin];
          })
          .reverse(); // sort buckets reverse vertically
        yAxis.tickFormat((_, i) => buckets[i] ? buckets[i][0] : "");
        yAxisTitle = dataset["yVar"];
        xAxisTitle = `COUNT(${dataset["yVar"]})`;
      } else if (dataset["yVar"] !== null) {
        // [NA x N/O/T] => Horizontal histogram of count
        context.barChartConfig.legendGroup.style("display", "block");
        buckets = d3
          .rollups(
            prepared,
            (v) => utils.aggregate(v, "count", "yVar"),
            (d) => d["yVar"]
          )
          .sort(function (x, y) {
            return d3.ascending(y[0], x[0]); // sort buckets reverse vertically
          });
        buckets.forEach((d) => d.push(prepared.filter((obj) => obj["yVar"] == d[0])));
        yAxis.tickFormat((_, i) => buckets[i] ? `${buckets[i][0]}` : "");
        yAxisTitle = dataset["yVar"];
        xAxisTitle = `COUNT(${dataset["yVar"]})`;
      } else {
        // [NA x NA] => unsupported
        context.barChartConfig.legendGroup.style("display", "none");
        context.barChartConfig.barsGroup
          .append("text")
          .attr("class", "unsupported-text")
          .attr("transform", `translate(${context.plotWidth / 2},${context.plotHeight / 2})`)
          .attr("text-anchor", "middle")
          .html(context.barChartConfig.unsupportedMessage);
        return;
      }
      yScale.domain(d3.range(buckets.length));
      xScale = d3.scaleLinear().range([0, context.plotWidth]);
      
      // Handle negative values properly for horizontal charts with aggregated data
      let minVal = d3.min(buckets, (d) => d[1]) || 0;
      let maxVal = d3.max(buckets, (d) => d[1]) || 0;
      
      if (minVal >= 0) {
        xScale.domain([0, maxVal]).nice();
      } else if (maxVal <= 0) {
        xScale.domain([minVal, 0]).nice();
      } else {
        xScale.domain([minVal, maxVal]).nice();
      }
      
      xAxis = d3.axisBottom(xScale).tickFormat((d) => utils.formatLargeNum(+d));
    } else {
      // both xVar and yVar are defined
      if (yIsQ) {
        // yVar is Q => vertical bar chart
        xScale = d3.scaleBand().range([0, context.plotWidth]).padding(0.1);
        xAxis = d3.axisBottom(xScale);
        xAxisTitle = dataset["xVar"];
        yAxisTitle = `${aggTitle}(${dataset["yVar"]})`;
        
        if (xIsQ) {
          // [Q x Q] => bin x, rollup, aggregate y
          context.barChartConfig.legendGroup.style("display", "block");
          const bins = d3.bin().value((d) => +d["xVar"])(prepared);
          buckets = bins.map((bin) => {
            const lb = utils.formatLargeNum(+bin.x0); // lowerbound
            const ub = utils.formatLargeNum(+bin.x1); // upperbound
            const val = utils.aggregate(bin, aggType, "yVar");
            console.log('🔢 [Q x Q] aggregation:', { bin: `${lb}-${ub}`, aggType, val });
            return [`[${lb}, ${ub})`, val, bin];
          });
          xAxis.tickFormat((_, i) => buckets[i] ? buckets[i][0] : "");
        } else {
          // [N/O/T x Q] => rollup, aggregate
          context.barChartConfig.legendGroup.style("display", "block");
          buckets = d3
            .rollups(
              prepared,
              (v) => {
                const val = utils.aggregate(v, aggType, "yVar");
                console.log('🔢 [N/O/T x Q] aggregation:', { group: v[0]?.xVar, aggType, val, count: v.length });
                return val;
              },
              (d) => d["xVar"]
            )
            .sort(function (x, y) {
              return d3.ascending(x[0], y[0]); // sort buckets
            });
          buckets.forEach((d) => d.push(prepared.filter((obj) => obj["xVar"] == d[0])));
          xAxis.tickFormat((_, i) => buckets[i] ? `${buckets[i][0]}` : "");
        }
        xScale.domain(d3.range(buckets.length));
        yScale = d3.scaleLinear().range([context.plotHeight, 0]);
        
        // Handle Y-axis range properly based on value distribution
        let minVal = d3.min(buckets, (d) => d[1]) || 0;
        let maxVal = d3.max(buckets, (d) => d[1]) || 0;
        
        if (minVal >= 0) {
          yScale.domain([0, maxVal]).nice();
        } else if (maxVal <= 0) {
          yScale.domain([minVal, 0]).nice();
        } else {
          yScale.domain([minVal, maxVal]).nice();
        }
        
        yAxis = d3.axisLeft(yScale).tickFormat((d) => utils.formatLargeNum(+d));
      } else {
        // yVar is N/O/T => horizontal bar chart
        horizontal = true;
        yScale = d3.scaleBand().range([0, context.plotHeight]).padding(0.1);
        yAxis = d3.axisLeft(yScale);
        if (xIsQ) {
          // [Q x N/O/T] => rollup, aggregate => horizontal bar chart
          context.barChartConfig.legendGroup.style("display", "block");
          buckets = d3
            .rollups(
              prepared,
              (v) => {
                const val = utils.aggregate(v, aggType, "xVar");
                console.log('🔢 [Q x N/O/T] aggregation:', { group: v[0]?.yVar, aggType, val, count: v.length });
                return val;
              },
              (d) => d["yVar"]
            )
            .sort(function (x, y) {
              return d3.ascending(y[0], x[0]); // sort buckets reverse vertically
            });
          buckets.forEach((d) => d.push(prepared.filter((obj) => obj["yVar"] == d[0])));
          yAxis.tickFormat((_, i) => buckets[i] ? `${buckets[i][0]}` : "");
          yAxisTitle = dataset["yVar"];
          xAxisTitle = `${aggTitle}(${dataset["xVar"]})`;
        } else {
          // [N/O/T x N/O/T] => unsupported (handled by grouped bar chart above)
          context.barChartConfig.legendGroup.style("display", "none");
          context.barChartConfig.barsGroup
            .append("text")
            .attr("class", "unsupported-text")
            .attr("transform", `translate(${context.plotWidth / 2},${context.plotHeight / 2})`)
            .attr("text-anchor", "middle")
            .html(context.barChartConfig.unsupportedMessage);
          return;
        }
        yScale.domain(d3.range(buckets.length));
        xScale = d3.scaleLinear().range([0, context.plotWidth]);
        
        // Handle negative values properly for horizontal charts with aggregated data
        let minVal = d3.min(buckets, (d) => d[1]) || 0;
        let maxVal = d3.max(buckets, (d) => d[1]) || 0;
        
        if (minVal >= 0) {
          xScale.domain([0, maxVal]).nice();
        } else if (maxVal <= 0) {
          xScale.domain([minVal, 0]).nice();
        } else {
          xScale.domain([minVal, maxVal]).nice();
        }
        
        xAxis = d3.axisBottom(xScale).tickFormat((d) => utils.formatLargeNum(+d));
      }
    }

    // Force clear all axis content before redrawing
    context.barChartConfig.xAxisGroup.selectAll("*").remove();
    context.barChartConfig.yAxisGroup.selectAll("*").remove();

    // draw axes
    context.barChartConfig.xAxisGroup.call(xAxis);
    context.barChartConfig.yAxisGroup.call(yAxis);

    // Add zero line for charts with negative values
    if (buckets.length > 0) {
      let hasNegativeValues = buckets.some(d => d[1] < 0);
      if (hasNegativeValues) {
        if (horizontal) {
          context.barChartConfig.barsGroup
            .append("line")
            .attr("class", "zero-line")
            .attr("x1", xScale(0))
            .attr("x2", xScale(0))
            .attr("y1", 0)
            .attr("y2", context.plotHeight)
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
        } else {
          context.barChartConfig.barsGroup
            .append("line")
            .attr("class", "zero-line")
            .attr("x1", 0)
            .attr("x2", context.plotWidth)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
        }
      }
    }

    // draw axis titles
    context.barChartConfig.xAxisGroup
      .append("g")
      .classed("x axis title", true)
      .attr("opacity", 1)
      .attr("transform", `translate(${context.plotWidth / 2}, 0)`)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("dy", "3.71em")
      .text(xAxisTitle);
      
    context.barChartConfig.yAxisGroup
      .append("g")
      .classed("y axis title", true)
      .attr("opacity", 1)
      .attr("transform", `translate(-30, ${context.plotHeight / 2})`)
      .append("text")
      .attr("fill", "currentColor")
      .text(yAxisTitle);

    // prepare data labels for yAxis
    context.barChartConfig.yAxisGroup
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr("dx", "0.8em")
      .attr("dy", "-1.21em")
      .attr("transform", "rotate(-90)");

    // stagger every other tick label
    context.barChartConfig.xAxisGroup.selectAll(".tick").each(function (_, i) {
      if (i % 2 !== 0) {
        d3.select(this).select("line").attr("y2", 15);
        d3.select(this).select("text").attr("dy", "1.91em");
      }
    });
    context.barChartConfig.yAxisGroup.selectAll(".tick").each(function (_, i) {
      if (i % 2 !== 0) {
        d3.select(this).select("line").attr("x2", -15);
        d3.select(this).select("text").attr("dy", "-2.41em");
      }
    });

    // Store updated scales and axes back in the chart config
    context.barChartConfig.xScale = xScale;
    context.barChartConfig.yScale = yScale;
    context.barChartConfig.xAxis = xAxis;
    context.barChartConfig.yAxis = yAxis;

    // JOIN data selection using bucket label as key
    let dataBound = context.barChartConfig.barsGroup.selectAll(".post").data(buckets, (d) => `${d[0]}`);

    // ENTER new group for each bar and text label
    let enterSelection = dataBound.enter().append("g").classed("post", true);

    // ENTER text for all bars
    const offset = 5;
    enterSelection
      .append("text")
      .attr("transform", (d, i) => {
        let x, y;
        if (horizontal) {
          x = d[1] >= 0 ? xScale(d[1]) + offset : xScale(d[1]) - offset;
          y = yScale(i) + yScale.bandwidth() / 2 + 4;
        } else {
          x = xScale(i) + xScale.bandwidth() / 2;
          y = d[1] >= 0 ? yScale(d[1]) - offset : yScale(d[1]) + offset + 10;
        }
        return `translate(${x},${y})`;
      })
      .attr("display", "none")
      .style("text-anchor", (d) => {
        if (horizontal) {
          return d[1] >= 0 ? "start" : "end";
        } else {
          return "middle";
        }
      })
      .text((d) => utils.formatLargeNum(+d[1]));

    // ENTER all bars
    enterSelection
      .append("rect")
      .attr("transform", (d, i) => {
        if (horizontal) {
          d["x"] = d[1] >= 0 ? xScale(0) : xScale(d[1]);
          d["y"] = yScale(i);
        } else {
          d["x"] = xScale(i);
          d["y"] = d[1] >= 0 ? yScale(d[1]) : yScale(0);
        }
        return `translate(${d["x"]},${d["y"]})`;
      })
      .attr("height", (d) => {
        if (horizontal) {
          return yScale.bandwidth();
        } else {
          return Math.abs(yScale(d[1]) - yScale(0));
        }
      })
      .attr("width", (d) => {
        if (horizontal) {
          return Math.abs(xScale(d[1]) - xScale(0));
        } else {
          return xScale.bandwidth();
        }
      })
      .style("fill", "white")
      .style("fill-opacity", 0.8)
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this.parentNode).select("text").attr("display", "block");
        // Highlight bar
        d3.select(this)
          .style("stroke", "brown")
          .style("stroke-width", "3px");
        
        // Add hover functionality to show grouped data details
        context.utilsService.mouseoverGroup(context, event, this, {
          aggName: aggType,
          aggAxis: horizontal ? "x-axis" : "y-axis",
          binLabel: d[0],
          binValue: d[1],
          binData: d[2] || [], // Use the bin data if available, otherwise empty array
        });
      })
      .on("mouseout", function (event, d) {
        d3.select(this.parentNode).select("text").attr("display", "none");
        // Return to normal style
        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", "1px");
        
        // Remove hover functionality
        context.utilsService.mouseoutGroup(context, event, {
          aggName: aggType,
          aggAxis: horizontal ? "x-axis" : "y-axis",
          binLabel: d[0],
          binValue: d[1],
          binData: d[2] || [],
        });
      });

    // Hide legend since we're not using colors
    context.barChartConfig.legendGroup.style("display", "none");
    
    // FILTER can update `buckets` => must update hovered Objects list
    if (dataset["hoveredObjects"]["binName"]) {
      // binName set => there is a bin visible in details view, reset existing object
      let currentBinName = dataset["hoveredObjects"]["binName"];
      dataset["hoveredObjects"] = { binName: null, binAttr: null, points: {} };
      // look for the bin in the filtered data set. If not there, table is already reset!
      for (let bin of buckets) {
        if (bin[0] == currentBinName) {
          // found the bin! => update hovered Objects for possible FILTER
          dataset["hoveredObjects"]["binName"] = currentBinName;
          bin[2].forEach((d) => {
            const id = d[dataset["primaryKey"]];
            if (id !== "-") {
              // use dict OBJECT to update source data by reference!
              let dataPoint = originalDatasetDict[id];
              context.utilsService.colorDataPoint(context, dataPoint, bin[2]);
              dataset["hoveredObjects"]["points"][id] = dataPoint;
            }
          });
          break;
        }
      }
    }
  }

  /**
   * Create grouped bar chart when both xVar and yVar are categorical
   */
  createGroupedBarChart(context, prepared, dataset, utils) {
    // Clear any existing content
    context.barChartConfig.barsGroup.selectAll("*").remove();
    context.barChartConfig.legendGroup.selectAll("*").remove();
    context.barChartConfig.xAxisGroup.selectAll("*").remove();
    context.barChartConfig.yAxisGroup.selectAll("*").remove();
    
    // Determine if we have a quantitative variable to aggregate
    let hasQuantVar = false;
    let quantVar = null;
    let aggType = dataset["aggType"] || "count";
    
    // Only use quantitative variable if user explicitly wants to aggregate it
    // For now, let's just use counts when user selects two categorical variables
    // This respects the user's choice of variables
    hasQuantVar = false;
    quantVar = null;
    aggType = "count";

    console.log("Grouped bar chart - aggType:", aggType, "quantVar:", quantVar, "hasQuantVar:", hasQuantVar);

    // Get unique groups and subgroups, filtering out null/undefined values
    let groups = Array.from(new Set(prepared.map((d) => d.xVar).filter(d => d != null && d !== undefined))) as string[];
    let subgroups = Array.from(new Set(prepared.map((d) => d.yVar).filter(d => d != null && d !== undefined))) as string[];

    if (groups.length === 0 || subgroups.length === 0) {
      context.barChartConfig.legendGroup.style("display", "none");
      context.barChartConfig.barsGroup
        .append("text")
        .attr("class", "unsupported-text")
        .attr("transform", `translate(${context.plotWidth / 2},${context.plotHeight / 2})`)
        .attr("text-anchor", "middle")
        .html("No data available for grouped bar chart");
      return;
    }

    // Sort groups and subgroups for consistent ordering
    groups.sort();
    subgroups.sort();

    // Aggregate data for each (group, subgroup) combination
    let data = [];
    
    for (let group of groups) {
      let groupObj: { group: string; [key: string]: string | number } = { group };
      
      for (let sub of subgroups) {
        let groupData = prepared.filter((d) => d.xVar === group && d.yVar === sub);
        
        if (groupData.length > 0) {
          if (hasQuantVar && quantVar) {
            // Aggregate the quantitative variable
            groupObj[sub] = utils.aggregate(groupData, aggType, quantVar);
          } else {
            // Just count the records
            groupObj[sub] = utils.aggregate(groupData, "count", "xVar");
          }
        } else {
          groupObj[sub] = 0;
        }
      }
      data.push(groupObj);
    }

    // Calculate the range of all values to handle negative values properly
    let allValues: number[] = [];
    data.forEach(d => {
      subgroups.forEach(sub => {
        const val = d[sub] as number;
        if (val !== undefined && val !== null && !isNaN(val)) {
          allValues.push(val);
        }
      });
    });
    
    if (allValues.length === 0) {
      context.barChartConfig.legendGroup.style("display", "none");
      context.barChartConfig.barsGroup
        .append("text")
        .attr("class", "unsupported-text")
        .attr("transform", `translate(${context.plotWidth / 2},${context.plotHeight / 2})`)
        .attr("text-anchor", "middle")
        .html("No valid data for grouped bar chart");
      return;
    }

    // X scale for groups
    let x0 = d3.scaleBand().domain(groups).range([0, context.plotWidth]).padding(0.2);
    // X scale for subgroups
    let x1 = d3.scaleBand().domain(subgroups).range([0, x0.bandwidth()]).padding(0.05);
    
    // Y scale - properly handle negative values
    let yMin = d3.min(allValues) || 0;
    let yMax = d3.max(allValues) || 0;
    
    if (yMin >= 0) {
      // All values are positive or zero: range from 0 to max
      yMin = 0;
    } else if (yMax <= 0) {
      // All values are negative or zero: range from min to 0
      yMax = 0;
    }
    // Mixed positive and negative: range from min to max (already set)
    
    // Add some padding to the domain
    let padding = (yMax - yMin) * 0.1;
    yMin -= padding;
    yMax += padding;
    
    let y = d3.scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([context.plotHeight, 0]);
    
    // Color scale
    let color = d3.scaleOrdinal().domain(subgroups).range(d3.schemeCategory10);

    // Draw axes
    context.barChartConfig.xAxisGroup.call(d3.axisBottom(x0));
    context.barChartConfig.yAxisGroup.call(d3.axisLeft(y).tickFormat((d) => utils.formatLargeNum(+d)));

    // Add zero line if we have negative values
    if (yMin < 0) {
      context.barChartConfig.barsGroup
        .append("line")
        .attr("x1", 0)
        .attr("x2", context.plotWidth)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
    }

    // Draw axis titles
    let xAxisTitle = dataset["xVar"];
    let yAxisTitle = hasQuantVar && quantVar 
      ? `${(context.userConfig["aggregationMapping"][aggType] || aggType).toUpperCase()}(${quantVar})`
      : dataset["yVar"];

    context.barChartConfig.xAxisGroup
      .append("g")
      .classed("x axis title", true)
      .attr("opacity", 1)
      .attr("transform", `translate(${context.plotWidth / 2}, 0)`)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("dy", "3.71em")
      .text(xAxisTitle);

    context.barChartConfig.yAxisGroup
      .append("g")
      .classed("y axis title", true)
      .attr("opacity", 1)
      .attr("transform", `translate(-40, ${context.plotHeight / 2})`)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("transform", "rotate(-90)")
      .text(yAxisTitle);

    // Stagger every other tick label for x-axis
    context.barChartConfig.xAxisGroup.selectAll(".tick").each(function (_, i) {
      if (i % 2 !== 0) {
        d3.select(this).select("line").attr("y2", 15);
        d3.select(this).select("text").attr("dy", "1.91em");
      }
    });

    // Draw bars with proper data binding
    let bars = context.barChartConfig.barsGroup.selectAll(".bar-group").data(data, d => d.group);
    bars.exit().remove();
    
    let barsEnter = bars.enter().append("g").classed("bar-group", true);
    bars = barsEnter.merge(bars);
    
    bars.attr("transform", d => `translate(${x0(d.group)},0)`);

    // Create rectangles for each subgroup
    let rects = bars.selectAll("rect").data(d => subgroups.map(sub => ({ 
      subgroup: sub, 
      value: d[sub] as number || 0,
      group: d.group 
    })));

    rects.exit().remove();

    let rectsEnter = rects.enter().append("rect");
    rects = rectsEnter.merge(rects);

    rects
      .attr("x", d => x1(d.subgroup))
      .attr("y", d => d.value >= 0 ? y(d.value) : y(0))
      .attr("width", x1.bandwidth())
      .attr("height", d => Math.abs(y(d.value) - y(0)))
      .attr("fill", d => color(d.subgroup))
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .style("stroke", "brown")
          .style("stroke-width", "3px");
        
        // Show the specific value label for this bar only
        // Find the corresponding text element for this specific subgroup
        d3.select(this.parentNode)
          .selectAll("text")
          .filter(function(textData: any) {
            return textData && textData.subgroup === d.subgroup;
          })
          .attr("display", "block");
        
        // Add hover functionality to show grouped data details
        // Find the data points for this specific subgroup within the group
        let groupData = prepared.filter((item) => item.xVar === d.group && item.yVar === d.subgroup);
        
        context.utilsService.mouseoverGroup(context, event, this, {
          aggName: aggType,
          aggAxis: "y-axis",
          binLabel: `${d.group} x ${d.subgroup}`,
          binValue: d.value,
          binData: groupData,
        });
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .style("stroke", "black")
          .style("stroke-width", "1px");
        
        // Hide the specific value label for this bar only
        d3.select(this.parentNode)
          .selectAll("text")
          .filter(function(textData: any) {
            return textData && textData.subgroup === d.subgroup;
          })
          .attr("display", "none");
        
        // Remove hover functionality
        let groupData = prepared.filter((item) => item.xVar === d.group && item.yVar === d.subgroup);
        
        context.utilsService.mouseoutGroup(context, event, {
          aggName: aggType,
          aggAxis: "y-axis",
          binLabel: `${d.group} x ${d.subgroup}`,
          binValue: d.value,
          binData: groupData,
        });
      });

    // Draw legend
    context.barChartConfig.legendGroup.style("display", "block");
    
    let legend = context.barChartConfig.legendGroup
      .selectAll("g")
      .data(subgroups)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(${context.plotWidth - 120}, ${i * 20 + 10})`);

    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => color(d))
      .style("stroke", "black")
      .style("stroke-width", "1px");

    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d)
      .style("font-size", "12px");

    // Also update the value labels section to ensure proper data binding
    // Add value labels on bars (with proper data binding for hover)
    let labels = bars.selectAll("text").data(d => subgroups.map(sub => ({ 
      subgroup: sub, 
      value: d[sub] as number || 0,
      group: d.group 
    })), d => `${d.group}-${d.subgroup}`); // Add key function for proper data binding

    labels.exit().remove();

    let labelsEnter = labels.enter().append("text");
    labels = labelsEnter.merge(labels);

    labels
      .attr("x", d => x1(d.subgroup) + x1.bandwidth() / 2)
      .attr("y", d => d.value >= 0 ? y(d.value) - 5 : y(d.value) + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text(d => utils.formatLargeNum(+d.value))
      .style("pointer-events", "none")
      .attr("display", "none") // Hide by default, show on hover
      .attr("data-subgroup", d => d.subgroup); // Add data attribute to help with filtering

    // Store the scales for potential future use
    context.barChartConfig.xScale = x0;
    context.barChartConfig.yScale = y;
    context.barChartConfig.xAxis = d3.axisBottom(x0);
    context.barChartConfig.yAxis = d3.axisLeft(y).tickFormat((d) => utils.formatLargeNum(+d));
    
    // FILTER can update data => must update hovered Objects list
    if (dataset["hoveredObjects"]["binName"]) {
      // binName set => there is a bin visible in details view, reset existing object
      let currentBinName = dataset["hoveredObjects"]["binName"];
      let originalDatasetDict = context.userConfig["originalDatasetDict"];
      dataset["hoveredObjects"] = { binName: null, binAttr: null, points: {} };
      // look for the bin in the filtered data set. If not there, table is already reset!
      for (let group of groups) {
        for (let sub of subgroups) {
          let binLabel = `${group} x ${sub}`;
          if (binLabel == currentBinName) {
            // found the bin! => update hovered Objects for possible FILTER
            dataset["hoveredObjects"]["binName"] = currentBinName;
            let groupData = prepared.filter((d) => d.xVar === group && d.yVar === sub);
            groupData.forEach((d) => {
              const id = d[dataset["primaryKey"]];
              if (id !== "-") {
                // use dict OBJECT to update source data by reference!
                let dataPoint = originalDatasetDict[id];
                context.utilsService.colorDataPoint(context, dataPoint, groupData);
                dataset["hoveredObjects"]["points"][id] = dataPoint;
              }
            });
            break;
          }
        }
      }
    }
  }
}