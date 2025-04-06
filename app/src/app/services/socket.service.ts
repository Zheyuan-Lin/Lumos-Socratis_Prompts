// libraries
import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { map } from "rxjs/operators";
import { SessionPage } from "../models/config";
import { Observable, Subject } from "rxjs";

@Injectable()
export class ChatService {
  constructor(
    private vizSocket: Socket,
    private global: SessionPage
  ) {}

  connectToSocket() {
    this.vizSocket.connect();
  }

  removeAllListenersAndDisconnectFromSocket() {
    this.vizSocket.removeAllListeners();
    this.vizSocket.disconnect();
  }

  sendMessageToSaveSessionLogs(data, participantId) {
    let payload = {
      data: data,
      participantId: participantId,
    };
    this.vizSocket.emit("on_session_end_page_level_logs", payload);
  }

  sendMessageToSaveLogs() {
    this.vizSocket.emit("on_save_logs", null);
  }

  sendMessageToRestartBiasComputation() {
    this.vizSocket.emit("on_reset_bias_computation", null);
  }

  sendInteractionResponse(payload) {
    this.vizSocket.emit("on_interaction", payload);
  }

  getDisconnectEventResponse() {
    return this.vizSocket.fromEvent("disconnect").pipe(map((obj) => obj));
  }

  getConnectEventResponse() {
    return this.vizSocket.fromEvent("connect").pipe(map((obj) => obj));
  }

  getInteractionResponse() {
    return this.vizSocket
      .fromEvent("interaction_response")
      .pipe(map((obj) => obj));
  }

  getAttributeDistribution() {
    return this.vizSocket
      .fromEvent("attribute_distribution")
      .pipe(map((obj) => obj));
  }

  sendQuestionResponse(questionId: string, question: string, response: string) {
    const payload = {
      question_id: questionId,
      response: response,
      question: question,
      participant_id: this.global.participantId,
      timestamp: new Date().toISOString()
    };
    this.vizSocket.emit("on_question_response", payload);
  }

  getExternalQuestion() {
    return this.vizSocket.fromEvent("question").pipe(map((obj) => {
      return obj;
    }));
  }

  sendInsights(payload) {
    this.vizSocket.emit("on_insight", payload);
  }
}