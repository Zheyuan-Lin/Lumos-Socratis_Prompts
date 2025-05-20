// libraries
import * as d3 from "d3";
import { Injectable } from "@angular/core";
// local
import { InteractionTypes } from "src/app/models/config";
import { Message } from "../models/message";

@Injectable()
export class UtilsService {
  private appConfig: any;
  private global: any;
  private chatService: any;
  private utilsService: UtilsService;

  appMode: string;
  appType: string;
  appLevel: string;

  constructor() {
    this.utilsService = this;
    this.appMode = "synthetic_voters_v14.csv";
    this.appType = "AWARENESS";
    this.appLevel = "live";
  }

  /**
   * Generates a random alphanumeric string of `length` characters.
   */
  generateRandomUniqueString(length: number) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Generates random app type between CONTROL and AWARENESS
   */
  generateRandomAppType() {
    return Math.random() >= 0.5 ? "CONTROL" : "AWARENESS";
  }

  /**
   * Get current time. E.g. usage: timestamp of interaction
   */
  getCurrentTime() {
    return new Date().getTime();
  }

  /**
   * Creates 2 smaller arrays from attribute list for single item detail view.
   */
  chunkAttrArray(dataset) {
    let arr = dataset.attributeList;
    let chunkSize = Math.ceil(arr.length / 2);
    if (chunkSize <= 0) throw "Cannot split attributes into 2 columns in detail view.";
    let R = [];
    for (let i = 0, len = arr.length; i < len; i += chunkSize) {
      R.push(arr.slice(i, i + chunkSize));
    }
    return R;
  }

  /**
   * Reducer for calculating sum of a list of numbers.
   */
  sum(acc: number, cur: number) {
    return acc + cur;
  }

  /**
   * Reducer for calculating max of a list of numbers.
   */
  max(acc: number, cur: number) {
    return acc > cur ? acc : cur;
  }

  /**
   * Reducer for calculating total times visited.
   */
  sumTimesVisited(acc: number, cur: number) {
    return acc + cur["timesVisited"];
  }

  /**
   * Reducer for calculating max times visited.
   */
  maxTimesVisited(acc: number, cur: number) {
    return acc > cur["timesVisited"] ? acc : cur["timesVisited"];
  }

  /**
   * Return bool if attribute is measurement type "N", "O", "T", or "Q".
   */
  isMeasure(dataset, attr, measureScale) {
    return attr ? dataset.attributeDatatypeList[measureScale].indexOf(attr) !== -1 : false;
  }

  /**
   * Apply an aggregation function to the X or Y axis using d3 agg functions.
   */
  aggregate(values, aggType, xyVar) {
    if (values.length) {
      switch (aggType) {
        case "count":
          return d3.count(values, (d) => d[xyVar]);
        case "min":
          return d3.min(values, (d) => d[xyVar]);
        case "max":
          return d3.max(values, (d) => d[xyVar]);
        case "avg":
          return d3.mean(values, (d) => d[xyVar]);
        case "sum":
          return d3.sum(values, (d) => d[xyVar]);
        default:
          return 0; // no agg applied yet
      }
    }
    return 0; // values is empty
  }

  /**
   * Returns string of float rounded to up to 2 decimals formatted with suffix.
   *   e.g. 10,000,000 => 10M; 12,345.6789 => 12.35K
   */
  formatLargeNum(d: number) {
    if (d === 0) return "0";
    if (!d) return "";
    
    // Handle negative values
    const isNegative = d < 0;
    const absValue = Math.abs(d);
    
    let digits = (Math.log(absValue) * Math.LOG10E + 1) | 0;
    let result = "";
    
    if (digits >= 13) {
      result = `${Math.round((absValue / 1000000000000 + Number.EPSILON) * 100) / 100}T`;
    } else if (digits >= 10) {
      result = `${Math.round((absValue / 1000000000 + Number.EPSILON) * 100) / 100}B`;
    } else if (digits >= 7) {
      result = `${Math.round((absValue / 1000000 + Number.EPSILON) * 100) / 100}M`;
    } else if (digits >= 4) {
      result = `${Math.round((absValue / 1000 + Number.EPSILON) * 100) / 100}K`;
    } else {
      result = `${Math.round((absValue + Number.EPSILON) * 100) / 100}`;
    }
    
    return isNegative ? `-${result}` : result;
  }

  /**
   * Colors `dataPoint` based on points in `dataList`.
   */
  colorDataPoint(context, dataPoint, dataList) {
    let dataset = context.appConfig[context.global.appMode];
    if (context.global.appType == "CONTROL" || dataPoint["timesVisited"] == 0) {
      // no bias coloring!!
      dataPoint["ratioTimesVisited"] = 0;
      dataPoint["color"] = "white";
    } else {
      // bias color
      switch (dataset["colorByMode"]) {
        case "abs":
          const sumVisits = dataList.reduce(this.sumTimesVisited, 0) as number;
          dataPoint["ratioTimesVisited"] = dataPoint["timesVisited"] / sumVisits;
          dataPoint["color"] = context.userConfig.focusSequentialColorScale(dataPoint["ratioTimesVisited"]);
          break;
        case "rel":
          const maxVisits = dataList.reduce(this.maxTimesVisited, 0) as number;
          dataPoint["ratioTimesVisited"] = dataPoint["timesVisited"] / maxVisits;
          dataPoint["color"] = context.userConfig.focusSequentialColorScale(dataPoint["ratioTimesVisited"]);
          break;
        case "binary":
          const visited = dataPoint["timesVisited"] > 0;
          dataPoint["ratioTimesVisited"] = !visited ? 0 : 1;
          dataPoint["color"] = !visited
            ? "white"
            : context.userConfig.focusSequentialColorScale(dataPoint["ratioTimesVisited"]);
          break;
        default:
          dataPoint["ratioTimesVisited"] = 0;
          dataPoint["color"] = "white";
          break;
      }
    }
  }

  /**
   * Returns new message object for communicating with backend server.
   * Standardized method for all interaction messages.
   */
  initializeNewMessage(interactionType: string, data: any = {}): Message {
    const participantId = localStorage.getItem('userId');
    if (!participantId) {
      throw new Error('Participant ID not found in local storage');
    }

    return {
      appMode: this.appMode,
      appType: this.appType,
      appLevel: this.appLevel,
      chartType: '',
      interactionType,
      interactionDuration: 0,
      interactionAt: new Date().toISOString(),
      createdAt: new Date().getTime(),
      participantId,
      data,
      eventX: data.eventX || 0,
      eventY: data.eventY || 0
    };
  }

  /**
   * Adds the selected item to an object of selected datapoints.
   */
  clickAddItem(context, event, d) {
    let dataset = context.appConfig[context.global.appMode];
    const id = d[dataset["primaryKey"]];
    if (id !== "-" && !dataset["selectedObjects"].hasOwnProperty(id)) {
      // id is valid and does not exist yet in selectedObjects
      d["selected"] = true;
      dataset["selectedObject"] = d;
      dataset["selectedObjects"][id] = d;
      context.userConfig["originalDatasetDict"][id]["selected"] = true;
      /* Prepare and Send New Message - Start */
      let message = this.initializeNewMessage(InteractionTypes.CLICK_ADD_ITEM, { id: id, x: { name: dataset["xVar"], value: d["xVar"] }, y: { name: dataset["yVar"], value: d["yVar"] }, eventX: event.clientX, eventY: event.clientY });
      context.chatService.sendInteractionResponse(message);
      /* Prepare and Send New Message - End */
    }
  }

  /**
   * Removes the selected item from the object of selected datapoints.
   */
  clickRemoveItem(context, event, d) {
    let dataset = context.appConfig[context.global.appMode];
    const id = d[dataset["primaryKey"]];
    if (id !== "-" && dataset["selectedObjects"].hasOwnProperty(id)) {
      // id is valid and already exists in selectedObjects
      d["selected"] = false;
      context.userConfig["originalDatasetDict"][id]["selected"] = false;
      delete dataset["selectedObjects"][id];
      /* Prepare and Send New Message - Start */
      let message = this.initializeNewMessage(InteractionTypes.CLICK_REMOVE_ITEM, { id: id, x: { name: dataset["xVar"], value: d["xVar"] }, y: { name: dataset["yVar"], value: d["yVar"] }, eventX: event.clientX, eventY: event.clientY });
      context.chatService.sendInteractionResponse(message);
      /* Prepare and Send New Message - End */
    }
  }

  /**
   * Adds all selected items to an object of selected datapoints.
   */
  clickGroup(context, event, meta) {
    let ids = [];
    let xValues = [];
    let yValues = [];
    let dataset = context.appConfig[context.global.appMode];
    if (dataset["selectedGroups"].hasOwnProperty(meta.binLabel)) {
      // remove group and un-select all points in the group
      delete dataset["selectedGroups"][meta.binLabel];
      meta.binData.forEach((d) => {
        const id = d[dataset["primaryKey"]];
        if (id !== "-") {
          // id is valid => push values sequentially, using index as 'key'
          ids.push(id);
          xValues.push(d["xVar"]);
          yValues.push(d["yVar"]);
          d["selected"] = false;
          if (dataset["selectedObjects"].hasOwnProperty(id)) {
            // delete id from selectedObjects
            delete dataset["selectedObjects"][id];
            context.userConfig["originalDatasetDict"][id]["selected"] = false;
          }
        }
      });
    } else {
      // add group and select all points in the group
      dataset["selectedGroups"][meta.binLabel] = meta.binData;
      meta.binData.forEach((d) => {
        const id = d[dataset["primaryKey"]];
        if (id !== "-") {
          // id is valid => push values sequentially, using index as 'key'
          ids.push(id);
          xValues.push(d["xVar"]);
          yValues.push(d["yVar"]);
          d["selected"] = true;
          if (!dataset["selectedObjects"].hasOwnProperty(id)) {
            // add id to selectedObjects
            dataset["selectedObjects"][id] = d;
            context.userConfig["originalDatasetDict"][id]["selected"] = true;
          }
        }
      });
    }
    /* Prepare and Send New Message - Start */
    let message = this.initializeNewMessage(InteractionTypes.CLICK_GROUP, { id: ids, x: { name: dataset["xVar"], value: xValues }, y: { name: dataset["yVar"], value: yValues }, agg: { name: meta.aggName, axis: meta.aggAxis, value: meta.binValue, label: meta.binLabel } });
    message.eventX = event.clientX;
    message.eventY = event.clientY;
    context.chatService.sendInteractionResponse(message);
    /* Prepare and Send New Message - End */
  }

  /**
   * Adds the hovered item to an object of hovered datapoints.
   */
  mouseoverItem(context, event, d, element = null, styleAttr = null) {
    context.userConfig["hoverStartTime"] = this.getCurrentTime();
    if (!context.userConfig["hoverTimer"]) {
      // no hover timer function yet => set one to act after delay
      let this_ = this;
      let dataset = context.appConfig[context.global.appMode];
      dataset["hoveredObject"] = d; // add data to details table
      const delay = 350; // 350 ms delay before hover counts as an interaction
      context.userConfig["hoverTimer"] = setTimeout(function () {
        context.userConfig["hoverTimer"] = null;
        if (element && styleAttr) d3.select(element).style(styleAttr, "cyan");
        /* Prepare and Send New Message - Start */
        let message = this_.initializeNewMessage(InteractionTypes.MOUSEOVER_ITEM, { id: d[dataset["primaryKey"]], x: { name: dataset["xVar"], value: d["xVar"] }, y: { name: dataset["yVar"], value: d["yVar"] }, eventX: event.clientX, eventY: event.clientY });
        let startTime = context.userConfig["hoverStartTime"];
        let currentTime = this_.getCurrentTime();
        message.interactionDuration = currentTime - startTime;
        context.chatService.sendInteraction(message);
        /* Prepare and Send New Message - End */
      }, delay);
    }
  }

  /**
   * Removes the hovered item from the object of hovered datapoints.
   */
  mouseoutItem(context, event, d) {
    let dataset = context.appConfig[context.global.appMode];
    dataset["hoveredObject"] = { hovered: false }; // remove point from table
    if (context.userConfig["hoverTimer"]) {
      // Hover was not long enough => reset for next hover
      clearTimeout(context.userConfig["hoverTimer"]);
      context.userConfig["hoverTimer"] = null;
    } else {
      // Hover was long enough => count as an interaction, update server
      /* Prepare and Send New Message - Start */
      let message = this.initializeNewMessage(InteractionTypes.MOUSEOUT_ITEM, { id: d[dataset["primaryKey"]], x: { name: dataset["xVar"], value: d["xVar"] }, y: { name: dataset["yVar"], value: d["yVar"] }, eventX: event.clientX, eventY: event.clientY });
      let startTime = context.userConfig["hoverStartTime"];
      let currentTime = this.getCurrentTime();
      message.interactionDuration = currentTime - startTime;
      context.chatService.sendInteraction(message);
      /* Prepare and Send New Message - End */
    }
  }

  /**
   * Adds all hovered items to an object of hovered datapoints.
   */
  mouseoverGroup(context, event, element, meta) {
    let dataPointIDs = [];
    let xValues = [];
    let yValues = [];
    let dataset = context.appConfig[context.global.appMode];
    let originalDatasetDict = context.userConfig["originalDatasetDict"];
    // update hovered Objects and collect them for server
    dataset["hoveredObjects"]["binName"] = meta.binLabel;
    switch (meta.aggAxis) {
      case "x-axis":
        dataset["hoveredObjects"]["binAttr"] = dataset["yVar"];
        break;
      case "y-axis":
        dataset["hoveredObjects"]["binAttr"] = dataset["xVar"];
        break;
    }
    let hoveredPoints = dataset["hoveredObjects"]["points"];
    meta.binData.forEach((d) => {
      const id = d[dataset["primaryKey"]];
      if (id !== "-") {
        let dataPoint = originalDatasetDict[id];
        if (meta.aggName == "min" || meta.aggName == "max") {
          // only add points if they are equal to the min or max value
          if (meta.aggAxis == "x-axis" && dataPoint[dataset["xVar"]] === meta.binValue) {
            // order of insertion is preserved for the server! super important!!
            dataPointIDs.push(id);
            xValues.push(d["xVar"]);
            yValues.push(d["yVar"]);
            // use dict OBJECT to update source data by reference!
            this.colorDataPoint(context, dataPoint, meta.binData);
            hoveredPoints[id] = dataPoint; // add new points to details table
          } else if (meta.aggAxis == "y-axis" && dataPoint[dataset["yVar"]] === meta.binValue) {
            // order of insertion is preserved for the server! super important!!
            dataPointIDs.push(id);
            xValues.push(d["xVar"]);
            yValues.push(d["yVar"]);
            // use dict OBJECT to update source data by reference!
            this.colorDataPoint(context, dataPoint, meta.binData);
            hoveredPoints[id] = dataPoint; // add new points to details table
          }
        } else {
          // order of insertion is preserved for the server! super important!!
          dataPointIDs.push(id);
          xValues.push(d["xVar"]);
          yValues.push(d["yVar"]);
          // use dict OBJECT to update source data by reference!
          this.colorDataPoint(context, dataPoint, meta.binData);
          hoveredPoints[id] = dataPoint; // add new points to details table
        }
      }
    });
    // remove existing hovered points if they aren't in the new hover group!
    Object.keys(hoveredPoints).forEach((id) => {
      if (dataPointIDs.indexOf(id) === -1) {
        delete hoveredPoints[id];
      }
    });
    context.userConfig["hoverStartTime"] = this.getCurrentTime();
    if (!context.userConfig["hoverTimer"]) {
      // no hover timer function yet => set one to act after delay
      let this_ = this;
      const delay = 350; // 350 ms delay before hover counts as an interaction
      context.userConfig["hoverTimer"] = setTimeout(function () {
        // reset timer function and set hovered object properties for point
        context.userConfig["hoverTimer"] = null;
        if (element) d3.select(element).style("fill", "cyan");
        /* Prepare and Send New Message - Start */
        let message = this_.initializeNewMessage(InteractionTypes.MOUSEOVER_GROUP, { id: dataPointIDs, x: { name: dataset["xVar"], value: xValues }, y: { name: dataset["yVar"], value: yValues }, agg: { name: meta.aggName, axis: meta.aggAxis, value: meta.binValue, label: meta.binLabel } });
        let startTime = context.userConfig["hoverStartTime"];
        let currentTime = this_.getCurrentTime();
        message.interactionDuration = currentTime - startTime;
        message.eventX = event.clientX;
        message.eventY = event.clientY;
        context.chatService.sendInteractionResponse(message);
        /* Prepare and Send New Message - End */
      }, delay);
    }
  }

  /**
   * Removes all hovered items from the object of hovered datapoints.
   */
  mouseoutGroup(context, event, meta) {
    let dataset = context.appConfig[context.global.appMode];
    if (context.userConfig["hoverTimer"]) {
      // Reset function if point wasn't hovered on long enough
      clearTimeout(context.userConfig["hoverTimer"]);
      context.userConfig["hoverTimer"] = null;
      // dataset["hoveredObjects"] = { binName: null, points: {} }; // remove hovered objects
    } else {
      // Hover was long enough => send message
      let dataPointIDs = [];
      let xValues = [];
      let yValues = [];
      meta.binData.forEach((d) => {
        const id = d[dataset["primaryKey"]];
        if (id !== "-") {
          let dataPoint = context.userConfig["originalDatasetDict"][id];
          if (meta.aggName == "min" || meta.aggName == "max") {
            // only add points if they are equal to the min or max value
            if (meta.aggAxis == "x-axis" && dataPoint[dataset["xVar"]] === meta.binValue) {
              // order of insertion is preserved for the server! super important!!
              dataPointIDs.push(id);
              xValues.push(d["xVar"]);
              yValues.push(d["yVar"]);
            } else if (meta.aggAxis == "y-axis" && dataPoint[dataset["yVar"]] === meta.binValue) {
              // order of insertion is preserved for the server! super important!!
              dataPointIDs.push(id);
              xValues.push(d["xVar"]);
              yValues.push(d["yVar"]);
            }
          } else {
            // order of insertion is preserved for the server! super important!!
            dataPointIDs.push(id);
            xValues.push(d["xVar"]);
            yValues.push(d["yVar"]);
          }
        }
      });
      /* Prepare and Send New Message - Start */
      let message = this.initializeNewMessage(InteractionTypes.MOUSEOUT_GROUP, { id: dataPointIDs, x: { name: dataset["xVar"], value: xValues }, y: { name: dataset["yVar"], value: yValues }, agg: { name: meta.aggName, axis: meta.aggAxis, value: meta.binValue, label: meta.binLabel } });
      let startTime = context.userConfig["hoverStartTime"];
      let currentTime = this.getCurrentTime();
      message.interactionDuration = currentTime - startTime;
      message.eventX = event.clientX;
      message.eventY = event.clientY;
      context.chatService.sendInteractionResponse(message);
      /* Prepare and Send New Message - End */
    }
  }

  swapXY() {
    let dataset = this.appConfig[this.global.appMode];
    let xVar = dataset["xVar"];
    dataset["xVar"] = dataset["yVar"];
    dataset["yVar"] = xVar;
    this.updateVis();
    /* Prepare and Send New Message - Start */
    let message = this.initializeNewMessage(InteractionTypes.SWAP_AXES_ATTRIBUTES);
    this.chatService.sendInteraction(message);
    /* Prepare and Send New Message - End */
  }

  addFilter(attribute) {
    let dataset = this.appConfig[this.global.appMode];
    dataset["attributes"][attribute]["filter"] = true;
    dataset["attributeInteracted"][attribute] += 1;

    /* Prepare and Send New Message - Start */
    let message = this.initializeNewMessage(InteractionTypes.ADD_FILTER, {
      attribute: attribute
    });
    this.chatService.sendInteraction(message);
    /* Prepare and Send New Message - End */
  }

  removeFilter(attribute, updateVis = true, sendMessage = true) {
    let dataset = this.appConfig[this.global.appMode];
    let attrConfig = dataset["attributes"][attribute];
    if (this.utilsService.isMeasure(dataset, attribute, "N")) {
      attrConfig["filterModel"] = attrConfig["types"];
    } else if (this.utilsService.isMeasure(dataset, attribute, "O")) {
      attrConfig["filterModel"] = attrConfig["types"];
    } else if (this.utilsService.isMeasure(dataset, attribute, "Q")) {
      attrConfig["filterModel"] = [attrConfig["min"], attrConfig["max"]];
    } else if (this.utilsService.isMeasure(dataset, attribute, "T")) {
      attrConfig["filterModel"] = [attrConfig["min"], attrConfig["max"]];
    }

    attrConfig["filter"] = false;
    if (updateVis) this.updateVis();

    if (sendMessage) {
      /* Prepare and Send New Message - Start */
      let message = this.initializeNewMessage(InteractionTypes.REMOVE_FILTER, {
        attribute: attribute
      });
      this.chatService.sendInteraction(message);
      /* Prepare and Send New Message - End */
    }
  }

  removeFilters(updateVis = true) {
    this.appConfig[this.global.appMode].attributeList.forEach((attribute) =>
      this.removeFilter(attribute, false, false)
    );
    if (updateVis) this.updateVis();

    /* Prepare and Send New Message - Start */
    let message = this.initializeNewMessage(InteractionTypes.REMOVE_ALL_FILTERS);
    this.chatService.sendInteraction(message);
    /* Prepare and Send New Message - End */
  }

  resetAllEncodings() {
    this.onChangeChart(null, true, false);
    this.onChangeAttribute(null, "x_axis", true, false);
    this.onChangeAttribute(null, "y_axis", true, false);

    // ToDo:- Revisit this code-block when the onChangeColorByMode is available by default for all appModes.
    if (this.global.appMode == "ADMIN") {
      this.onChangeVISColorByMode(null, true, false);
      this.onChangeAttributeColorByMode(null, true, false);
    }
    this.updateVis(); // only update the vis after all encodings are reset

    /* Prepare and Send New Message - Start */
    let message = this.initializeNewMessage(InteractionTypes.REMOVE_ALL_ENCODINGS);
    this.chatService.sendInteraction(message);
    /* Prepare and Send New Message - End */
  }

  updateVis(): void {
    // Implementation will be added
  }

  onChangeChart(value: any, updateVis: boolean, sendMessage: boolean): void {
    // Implementation will be added
  }

  onChangeAttribute(value: any, axis: string, updateVis: boolean, sendMessage: boolean): void {
    // Implementation will be added
  }

  onChangeVISColorByMode(value: any, updateVis: boolean, sendMessage: boolean): void {
    // Implementation will be added
  }

  onChangeAttributeColorByMode(value: any, updateVis: boolean, sendMessage: boolean): void {
    // Implementation will be added
  }
}
