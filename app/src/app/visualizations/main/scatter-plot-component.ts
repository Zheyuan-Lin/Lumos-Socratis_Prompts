// libraries
import * as d3 from "d3";
import $ from "jquery";
import * as seedrandom from "seedrandom";
// local
import { ScatterPlotConfig } from "src/app/models/viz";
import { sequentialColorRange, SessionPage } from "src/app/models/config";
import { UtilsService } from "src/app/services/utils.service";
import { ChatService } from "src/app/services/socket.service";

export class ScatterPlot {
  scatterPlotConfig;
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
    this.scatterPlotConfig = new ScatterPlotConfig();
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

    // Add plot group
    context.plotGroup = svg
      .append("g")
      .classed("plot", true)
      .attr("transform", `translate(${plotMargins.left}, ${plotMargins.top})`);

    // Add X and Y axis groups
    context.scatterPlotConfig.yAxisGroup = context.plotGroup.append("g").classed("y", true).classed("axis", true);
    context.scatterPlotConfig.xAxisGroup = context.plotGroup
      .append("g")
      .classed("x", true)
      .classed("axis", true)
      .attr("transform", `translate(${0}, ${context.plotHeight})`);

    // Add point groups
    context.scatterPlotConfig.pointsGroup = context.plotGroup.append("g").classed("points", true);

    // Add legend group - but don't add gradient or text
    context.scatterPlotConfig.legendGroup = context.plotGroup.append("g").classed("legend", true);
    // Hide the legend completely
    context.scatterPlotConfig.legendGroup.style("display", "none");

    // Create unsupported text to display if chart cannot render
    context.scatterPlotConfig.unsupportedMessage = `
      <tspan>
        If using numerical
        (<tspan style="font-family: 'Font Awesome 5 Free'; font-weight: 800 !important">&#xf292;</tspan>)
        attributes,
      </tspan>
      <tspan x="0" dy="1.2em">
        you must have
        <tspan style="font-weight: 800 !important">more than one</tspan>!
      </tspan>`;
  }

  /**
   * Calculate new values and re-draw plot.
   */
  update() {
    let context = this;
    let originalDatasetDict = context.userConfig["originalDatasetDict"];
    let dataset = context.appConfig[context.global.appMode];

    // if there's no dataset don't update the bar chart
    if (!originalDatasetDict) return;

    // Clear unsupported message
    context.scatterPlotConfig.pointsGroup.select(".unsupported-text").remove();

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

    // Initialize context variables
    let xAxisTitle = "";
    let yAxisTitle = "";
    let xIsNA = dataset["xVar"] == null;
    let yIsNA = dataset["yVar"] == null;
    let xIsQ = context.utilsService.isMeasure(dataset, dataset["xVar"], "Q");
    let yIsQ = context.utilsService.isMeasure(dataset, dataset["yVar"], "Q");

    if ((!xIsQ && !yIsQ) || xIsNA || yIsNA) {
      // [N/O/T x N/O/T] OR [N/O/T/Q x NA] OR [NA x N/O/T/Q] => unsupported
      prepared = [];
      context.scatterPlotConfig.xScale = d3.scaleLinear().domain([]).range([0, context.plotWidth]);
      context.scatterPlotConfig.yScale = d3.scaleLinear().domain([]).range([context.plotHeight, 0]);
      context.scatterPlotConfig.legendGroup.style("display", "none");
      context.scatterPlotConfig.pointsGroup
        .append("text")
        .attr("class", "unsupported-text")
        .attr("transform", `translate(${context.plotWidth / 2},${context.plotHeight / 2})`)
        .attr("text-anchor", "middle")
        .html(context.scatterPlotConfig.unsupportedMessage);
    } else {
      // both x and y are defined => set axis titles and display legend
      // Keep legend hidden even for supported plots
      context.scatterPlotConfig.legendGroup.style("display", "none");
      xAxisTitle = dataset["xVar"];
      yAxisTitle = dataset["yVar"];
      if (xIsQ) {
        // x is Q => scale linear
        context.scatterPlotConfig.xScale = d3
          .scaleLinear()
          .domain(
            d3.extent(rawData, function (d) {
              return d["xVar"];
            })
          )
          .range([0, context.plotWidth]);
      } else {
        // x is N/O/T => scale ordinal
        context.scatterPlotConfig.xScale = d3
          .scaleBand()
          .domain(
            rawData
              .map(function (d) {
                return d["xVar"];
              })
              .sort(function (x, y) {
                return d3.ascending(x, y); // sort domain
              })
          )
          .rangeRound([0, context.plotWidth])
          .padding(0.1);
      }
      if (yIsQ) {
        // y is Q => scale linear
        context.scatterPlotConfig.yScale = d3
          .scaleLinear()
          .domain(
            d3.extent(rawData, function (d) {
              return d["yVar"];
            })
          )
          .range([context.plotHeight, 0]);
      } else {
        // y is N/O/T => scale ordinal
        context.scatterPlotConfig.yScale = d3
          .scaleBand()
          .domain(
            rawData
              .map(function (d) {
                return d["yVar"];
              })
              .sort(function (x, y) {
                return d3.ascending(x, y); // sort domain
              })
          )
          .rangeRound([context.plotHeight, 0])
          .padding(0.1);
      }
    }

    // Update the AXIS domain to the extent of the FILTERED points.
    if (context.userConfig["axisRescale"] && prepared.length) {
      context.scatterPlotConfig.xScale.domain(prepared.map((d) => d["xVar"]));
      context.scatterPlotConfig.yScale.domain(prepared.map((d) => d["yVar"]));
    }

    // set x axis
    context.scatterPlotConfig.xAxis = d3
      .axisBottom(context.scatterPlotConfig.xScale)
      .tickFormat((d) => (xIsQ ? context.utilsService.formatLargeNum(+d) : d.toString()));

    // set y axis
    context.scatterPlotConfig.yAxis = d3
      .axisLeft(context.scatterPlotConfig.yScale)
      .tickFormat((d) => (yIsQ ? context.utilsService.formatLargeNum(+d) : d.toString()));

    // draw axes
    context.scatterPlotConfig.xAxisGroup.call(context.scatterPlotConfig.xAxis);
    context.scatterPlotConfig.yAxisGroup.call(context.scatterPlotConfig.yAxis);

    // draw axis titles
    context.scatterPlotConfig.xAxisGroup.select(".x.axis.title").remove();
    context.scatterPlotConfig.xAxisGroup
      .append("g")
      .classed("x axis title", true)
      .attr("opacity", 1)
      .attr("transform", `translate(${context.plotWidth / 2}, 0)`)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("dy", "3.71em")
      .text(xAxisTitle);
    context.scatterPlotConfig.yAxisGroup.select(".y.axis.title").remove();
    context.scatterPlotConfig.yAxisGroup
      .append("g")
      .classed("y axis title", true)
      .attr("opacity", 1)
      .attr("transform", `translate(-30, ${context.plotHeight / 2})`)
      .append("text")
      .attr("fill", "currentColor")
      .text(yAxisTitle);

    // prepare data labels for yAxis
    context.scatterPlotConfig.yAxisGroup
      .selectAll("text")
      .style("text-anchor", "middle")
      .attr("dx", "0.8em")
      .attr("dy", "-1.21em")
      .attr("transform", "rotate(-90)");

    // stagger every other tick label
    context.scatterPlotConfig.xAxisGroup.selectAll(".tick").each(function (_, i) {
      if (i % 2 !== 0) {
        d3.select(this).select("line").attr("y2", 15);
        d3.select(this).select("text").attr("dy", "1.91em");
      }
    });
    context.scatterPlotConfig.yAxisGroup.selectAll(".tick").each(function (_, i) {
      if (i % 2 !== 0) {
        d3.select(this).select("line").attr("x2", -15);
        d3.select(this).select("text").attr("dy", "-2.41em");
      }
    });

    // JOIN data selection using Primary Key label
    let dataBound = context.scatterPlotConfig.pointsGroup
      .selectAll(".post")
      .data(prepared, (d) => d[dataset["primaryKey"]]);

    // DELETE extra points
    dataBound.exit().remove();

    // ENTER new points (starting invisible, later fade them in)
    let enterSelection = dataBound.enter().append("g").classed("post", true);

    // UPDATE all existing points
    enterSelection.append("circle");
    enterSelection
      .merge(dataBound)
      .select("circle")
      .attr("transform", (d) => translatePoints(d, context, xIsQ, yIsQ))
      .attr("r", 6)
      .style("fill", "white")
      .style("fill-opacity", 0.8)
      .style("stroke-width", "1px")
      .style("stroke", "black")
      .on("mouseover", function (event, d) {
        // Update visual style
        d3.select(this)
          .style("stroke-width", "3px")
          .style("stroke", "brown");
        
        // Update hovered object data
        context.utilsService.mouseoverItem(context, event, d, this, "stroke");
      })
      .on("mouseout", function (event, d) {
        // Reset visual style
        d3.select(this)
          .style("stroke-width", "1px")
          .style("stroke", "black");
        
        // Clear hovered object data
        context.utilsService.mouseoutItem(context, event, d);
      });
  }
}

/**
 * Sets translate(x,y) string to pass to transform attr of each point.
 */
function translatePoints(d, context, xIsQ, yIsQ) {
  let translate = "";
  let dataset = context.appConfig[context.global.appMode];
  if (context.userConfig.jitterScatterplotPoints) {
    // Jitter the points!
    var jitter_factor = 50; // Increase this for more jitter.
    let rng = seedrandom(d[dataset["primaryKey"]] + context.global["participantId"]);
    // Jitter X
    var sign = rng() > 0.5 ? "-" : "+";
    var jitter = rng() * jitter_factor;
    if (xIsQ) {
      // x is Q
      d["jitter_x"] = context.scatterPlotConfig.xScale(d["xVar"]) + (sign == "-" ? -jitter : jitter);
    } else {
      // x is N/O/T
      d["jitter_x"] = context.scatterPlotConfig.xScale(d["xVar"]) + (sign == "-" ? -jitter : jitter);
      d["jitter_x"] += context.scatterPlotConfig.xScale.bandwidth() / 2;
    }
    // Jitter Y
    var sign = rng() > 0.5 ? "-" : "+";
    var jitter = rng() * jitter_factor;
    if (yIsQ) {
      // y is Q
      d["jitter_y"] = context.scatterPlotConfig.yScale(d["yVar"]) + (sign == "-" ? -jitter : jitter);
    } else {
      // y is N/O/T
      d["jitter_y"] = context.scatterPlotConfig.yScale(d["yVar"]) + (sign == "-" ? -jitter : jitter);
      d["jitter_y"] += context.scatterPlotConfig.yScale.bandwidth() / 2;
    }
    // Move the x back into the plot area
    if (d["jitter_x"] < 0) {
      d["jitter_x"] = rng() * jitter_factor;
    } else if (d["jitter_x"] > context.plotWidth) {
      d["jitter_x"] = context.plotWidth - rng() * jitter_factor;
    }
    // Move the y back into the plot area
    if (d["jitter_y"] < 0) {
      d["jitter_y"] = rng() * jitter_factor;
    } else if (d["jitter_y"] > context.plotHeight) {
      d["jitter_y"] = context.plotHeight - rng() * jitter_factor;
    }
    // set translation string
    translate = `translate(${d["jitter_x"]},${d["jitter_y"]})`;
  } else {
    // don't jitter!
    d["x"] = context.scatterPlotConfig.xScale(d["xVar"]);
    d["y"] = context.scatterPlotConfig.yScale(d["yVar"]);
    // align points in bands if x is N/O/T
    if (!xIsQ && dataset["xVar"] !== null) {
      d["x"] += context.scatterPlotConfig.xScale.bandwidth() / 2;
    }
    // align points in bands if y is N/O/T
    if (!yIsQ && dataset["yVar"] !== null) {
      d["y"] += context.scatterPlotConfig.yScale.bandwidth() / 2;
    }
    // set translation string
    translate = `translate(${d["x"]},${d["y"]})`;
  }
  return translate;
}