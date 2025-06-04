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

  // Add getter for socket ID
  getSocketId(): string {
    return this.vizSocket?.ioSocket?.id || 'not_connected';
  }

  connectToSocket() {
    console.log('Attempting to connect to socket...');
    
    // Add connection options for security
    this.vizSocket.ioSocket.io.opts = {
      ...this.vizSocket.ioSocket.io.opts,
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: true,
      rejectUnauthorized: false,
      secure: true
    };

    // Set up connection event handlers before connecting
    this.vizSocket.on('connect', () => {
      // Wait for next tick to ensure socket ID is available
      setTimeout(() => {
        const socketId = this.vizSocket.ioSocket.id;
        console.log('Socket connected successfully with ID:', socketId);
        // Request attribute distribution on connect with socket ID
        this.vizSocket.emit('request_attribute_distribution', { socketId });
      }, 100); // Increased timeout to ensure socket is fully initialized
    });

    this.vizSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Connection details:', {
        url: this.vizSocket.ioSocket.io.uri,
        opts: this.vizSocket.ioSocket.io.opts,
        transport: this.vizSocket.ioSocket.io.engine.transport.name
      });
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.vizSocket.connect();
      }, 5000);
    });

    this.vizSocket.on('disconnect', (reason) => {
      const socketId = this.vizSocket.ioSocket.id;
      console.log('Socket disconnected:', reason, 'Socket ID:', socketId);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.vizSocket.connect();
      }
    });

    this.vizSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen for attribute distribution updates
    this.vizSocket.on('attribute_distribution', (data) => {
      const socketId = this.vizSocket.ioSocket.id;
      console.log('Received attribute distribution for socket ID:', socketId, 'Data:', data);
      // Emit the data through the observable
      this.attributeDistributionSubject.next(data);
    });

    // Add ping/pong monitoring
    this.vizSocket.ioSocket.io.on('ping', () => {
      console.log('Ping sent');
    });

    this.vizSocket.ioSocket.io.on('pong', (latency) => {
      console.log('Pong received, latency:', latency, 'ms');
    });

    // Now connect after setting up all event handlers
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

  // Add a Subject for attribute distribution
  private attributeDistributionSubject = new Subject<any>();

  // Update the getAttributeDistribution method to use the Subject
  getAttributeDistribution() {
    return this.attributeDistributionSubject.asObservable();
  }

  sendQuestionResponse(response: any) {
    this.vizSocket.emit("on_question_response", response);
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