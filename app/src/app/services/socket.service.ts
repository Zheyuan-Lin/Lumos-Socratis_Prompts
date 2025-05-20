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
    console.log('Attempting to connect to socket...');
    this.vizSocket.connect();
    this.vizSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });
    this.vizSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
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

  sendInteraction(payload) {  
    this.vizSocket.emit("recieve_interaction", payload);
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
    const userId = localStorage.getItem('userId');
    const payload = {
      question_id: questionId,
      response: response,
      question: question,
      participant_id: userId,
      timestamp: new Date().toISOString()
    };
    this.vizSocket.emit("on_question_response", payload);
  }

  getExternalQuestion() {
    return this.vizSocket.fromEvent("question").pipe(map((obj) => {
      return obj;
    }));
  }

  onInsightSaved() {
    return this.vizSocket.fromEvent("insight_saved").pipe(map((obj) => {
      return obj;
    }));
  }

  onInsightError() {
    return this.vizSocket.fromEvent("insight_error").pipe(map((obj) => {
      return obj;
    }));
  }

  sendInsights(payload) {
    console.log('Attempting to send insight:', payload);
    if (this.vizSocket.ioSocket.connected) {
      console.log('Socket is connected, sending insight...');
      this.vizSocket.emit("on_insight", payload);
    } else {
      console.error('Socket not connected, attempting to reconnect...');
      this.connectToSocket();
      // Try to send again after a short delay
      setTimeout(() => {
        if (this.vizSocket.ioSocket.connected) {
          console.log('Socket reconnected, sending insight...');
          this.vizSocket.emit("on_insight", payload);
        } else {
          console.error('Failed to reconnect socket');
        }
      }, 1000);
    }
  }
}