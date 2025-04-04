export var AttributeDistributionPlotConfig = {
  "Q-pct": {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    width: 0, // ToDO - TO BE SET in COMPONENT
    height: 0, // ToDO - TO BE SET in COMPONENT
    data: { values: [] }, // ToDO - TO BE SET in COMPONENT
    config: {
      legend: {
        disable: false,
        orient: "top",
        labelFontSize: 12
      },
      axis: {
        titleFontSize: 14
      }
    },
    resolve: {
      axis: {
        x: "shared",
        y: "shared",
      },
      scale: {
        x: "shared",
        y: "shared",
      },
      legend: {
        color: "shared"
      }
    },
    layer: [
      {
        transform: [
          {
            filter: "", // "datum[<Attribute Name>] !== null" // ToDO - TO BE SET in COMPONENT
          },
          {
            bin: true,
            field: "", // ToDO - TO BE SET in COMPONENT
            as: "binned_attribute",
          },
          {
            aggregate: [{ op: "count", as: "count" }],
            groupby: ["binned_attribute", "binned_attribute_end"],
          },
          {
            window: [{ op: "sum", field: "count", as: "CumulativeCount" }],
            frame: [null, null],
          },
          {
            calculate: "datum.count/datum['CumulativeCount']",
            as: "percentageCount",
          },
          { calculate: "'Target'", as: "Target" },
        ],
        mark: {
          type: "line",
          stroke: "black",
          strokeWidth: 2,
          interpolate: "monotone",
        },
        encoding: {
          x: {
            field: "binned_attribute",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          y: {
            field: "percentageCount",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          color: {
            field: "Target",
            type: "ordinal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType,
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "circle"
            }
          },
        },
      },
      {
        transform: [
          {
            filter: "datum.focus_field !== null",
          },
          {
            bin: true,
            // bin: {"maxbins": 12},
            field: "focus_field",
            as: "binned_attribute2",
          },
          {
            aggregate: [{ op: "count", as: "count2" }],
            groupby: ["binned_attribute2", "binned_attribute2_end"],
          },
          {
            window: [{ op: "sum", field: "count2", as: "CumulativeCount2" }],
            frame: [null, null],
          },
          {
            calculate: "datum.count2/datum['CumulativeCount2']",
            as: "percentageCount2",
          },
          { calculate: "'Focus'", as: "Focus" },
        ],
        mark: {
          type: "area",
          interpolate: "monotone",
          stroke: "#3498db",
          color: "#3498db",
          fillOpacity: 0.3,
        },
        encoding: {
          x: {
            field: "binned_attribute2",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          y: {
            field: "percentageCount2",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          color: {
            field: "Focus",
            type: "ordinal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType,
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "circle"
            }
          },
        },
      },
      {
        transform: [
          {
            filter: "datum.selection_field !== null",
          },
          {
            bin: true,
            // bin: {"maxbins": 12},
            field: "selection_field",
            as: "binned_attribute3",
          },
          {
            aggregate: [{ op: "count", as: "count3" }],
            groupby: ["binned_attribute3", "binned_attribute3_end"],
          },
          {
            window: [{ op: "sum", field: "count3", as: "CumulativeCount3" }],
            frame: [null, null],
          },
          {
            calculate: "datum.count3/datum['CumulativeCount3']",
            as: "percentageCount3",
          },
          { calculate: "'Selection'", as: "Selection" },
        ],
        mark: {
          type: "area",
          interpolate: "monotone",
          stroke: "#2ecc71",
          fillOpacity: 0.3,
        },
        encoding: {
          x: {
            field: "binned_attribute3",
            type: "quantitative",
            title: "",
          },
          y: {
            field: "percentageCount3",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          color: {
            field: "Selection",
            type: "ordinal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType,
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "circle"
            }
          },
        },
      }
    ],
  },
  "Q-raw": {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    width: 0, // ToDO - TO BE SET in COMPONENT
    height: 0, // ToDO - TO BE SET in COMPONENT
    data: { values: [] }, // ToDO - TO BE SET in COMPONENT
    config: {
      legend: {
        disable: false,
        orient: "top",
        labelFontSize: 12
      },
      axis: {
        titleFontSize: 14
      }
    },
    resolve: {
      axis: {
        x: "shared",
        y: "shared",
      },
      scale: {
        x: "shared",
        y: "shared",
      },
      legend: {
        color: "shared"
      }
    },
    layer: [
      {
        transform: [
          {
            filter: "", // "datum[<Attribute Name>] !== null" // ToDO - TO BE SET in COMPONENT
          },
          {
            bin: true,
            field: "", // ToDO - TO BE SET in COMPONENT
            as: "binned_attribute",
          },
          {
            aggregate: [{ op: "count", as: "count" }],
            groupby: ["binned_attribute", "binned_attribute_end"],
          },
          { calculate: "'Target'", as: "Target" },
        ],
        mark: {
          type: "line",
          stroke: "black",
          strokeWidth: 2,
          interpolate: "monotone",
        },
        encoding: {
          x: {
            field: "binned_attribute",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          y: {
            field: "count",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          color: {
            field: "Target",
            type: "ordinal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType,
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "circle"
            }
          },        
        },
      },
      {
        transform: [
          {
            filter: "datum.focus_field !== null",
          },
          {
            bin: true,
            // bin: {"maxbins": 12},
            field: "focus_field",
            as: "binned_attribute2",
          },
          {
            aggregate: [{ op: "count", as: "count2" }],
            groupby: ["binned_attribute2", "binned_attribute2_end"],
          },
          { calculate: "'Focus'", as: "Focus" },
        ],
        mark: {
          type: "area",
          interpolate: "monotone",
          stroke: "#3498db",
          fillOpacity: 0.3,
        },
        encoding: {
          x: {
            field: "binned_attribute2",
            type: "quantitative",
            title: "",
          },
          y: {
            field: "count2",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          color: {
            field: "Focus",
            type: "ordinal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType,
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "circle"
            }
          },        
        },
      },
      {
        transform: [
          {
            filter: "datum.selection_field !== null",
          },
          {
            bin: true,
            // bin: {"maxbins": 12},
            field: "selection_field",
            as: "binned_attribute3",
          },
          {
            aggregate: [{ op: "count", as: "count3" }],
            groupby: ["binned_attribute3", "binned_attribute3_end"],
          },
          { calculate: "'Selection'", as: "Selection" },
        ],
        mark: {
          type: "area",
          interpolate: "monotone",
          stroke: "#2ecc71",
          fillOpacity: 0.3,
        },
        encoding: {
          x: {
            field: "binned_attribute3",
            type: "quantitative",
            title: "",
          },
          y: {
            field: "count3",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }
          },
          color: {
            field: "Selection",
            type: "ordinal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType,
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "circle"
            }
          },
        },
      },
    ],
  },
  N: {
    $schema: "https://vega.github.io/schema/vega-lite/v4.json",
    width: 0, // ToDO - TO BE SET in COMPONENT
    height: 0, // ToDO - TO BE SET in COMPONENT
    data: {
      values: [], // ToDO - TO BE SET in COMPONENT
    },
    config: {
      legend: {
        disable: false,
        orient: "top",
        labelFontSize: 12
      },
      axis: {
        titleFontSize: 14
      },
      tick: {
        bandSize: 0, // ToDO - TO BE SET in COMPONENT
      },
    },
    resolve: {
      axis: {
        x: "shared",
        y: "shared",
      },
      scale: {
        x: "shared",
        y: "shared",
      },
      legend: {
        color: "shared"
      }
    },
    transform: [
      { calculate: "'Target'", as: "Target" },
      { calculate: "'Focus'", as: "Focus" },
      { calculate: "'Selection'", as: "Selection" },
    ],
    layer: [
      {
        mark: {
          type: "tick",
          stroke: "black",
          strokeWidth: 2,
          interpolate: "monotone",
        },
        encoding: {
          x: {
            field: "x",
            type: "ordinal",
            axis: { title: "", labelOverlap: "greedy" },
          },
          y: {
            field: "count_data",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }, // ToDO - TO BE SET in COMPONENT
          },
          color: {
            field: "Target",
            type: "nominal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType, // Seems alphabetical: Target > Focus
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "square"
            }
          },
        },
      },
      {
        mark: {
          type: "bar",
          stroke: "#3498db",
          fillOpacity: 0.3,
          interpolate: "monotone",
        },
        encoding: {
          x: {
            field: "x",
            type: "ordinal",
            axis: { title: "", labelOverlap: "greedy" },
          },
          y: {
            field: "count_focus",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }, // ToDO - TO BE SET in COMPONENT
          },
          color: {
            field: "Focus",
            type: "nominal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType, // Seems alphabetical: Target > Focus
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "square"
            }
          },
        },
      },
      {
        mark: {
          type: "bar",
          stroke: "#2ecc71",
          fillOpacity: 0.3,
          interpolate: "monotone"
        },
        encoding: {
          x: {
            field: "x",
            type: "ordinal",
            axis: {title: "", labelOverlap: "greedy"}
          },
          y: {
            field: "count_selection",
            type: "quantitative",
            axis: { title: "", labelOverlap: "greedy" }, // ToDO - TO BE SET in COMPONENT
          },
          color: {
            field: "Selection",
            type: "nominal",
            title: null,
            scale: {
              domain: [], //ToDo: Set in Component depending on AppType,
              range: [], //ToDo: Set in Component depending on AppType, // Seems alphabetical: Target > Focus
            },
            legend:{
              symbolStrokeColor: "black",
              symbolType: "square"
            }
          },
        }
      },
    ],
  },
};