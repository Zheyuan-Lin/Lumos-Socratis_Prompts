// libraries
import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { map } from "rxjs/operators";
import { SessionPage } from "../models/config";
import { Observable, Subject } from "rxjs";

@Injectable()
export class ChatService {
  // Declare the socket server URL directly in the class
  private readonly SOCKET_SERVER_URL = 'https://socratic-prompt-d70074f075c9.herokuapp.com/';

  constructor(
    private vizSocket: Socket,
    private global: SessionPage
  ) {}

  // Add getter for socket ID
  getSocketId(): string {
    return this.vizSocket?.ioSocket?.id || 'not_connected';
  }

  // Add getter for socket server URL
  getSocketServerUrl(): string {
    return this.SOCKET_SERVER_URL;
  }

  connectToSocket() {
    console.log('=== SOCKET CONNECTION START ===');
    console.log('Socket server URL:', this.SOCKET_SERVER_URL);
    console.log('Current socket state:', {
      connected: this.vizSocket.ioSocket.connected,
      id: this.vizSocket.ioSocket.id,
      transport: this.vizSocket.ioSocket.io.engine?.transport?.name || 'unknown'
    });
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

    console.log('Connection options set:', this.vizSocket.ioSocket.io.opts);

    // Set up connection event handlers before connecting
    this.vizSocket.on('connect', () => {
      console.log('=== SOCKET CONNECTED SUCCESSFULLY ===');
      console.log('Connection details:', {
        socketId: this.vizSocket.ioSocket.id,
        transport: this.vizSocket.ioSocket.io.engine.transport.name,
        url: this.vizSocket.ioSocket.io.uri,
        port: this.vizSocket.ioSocket.io.engine.port,
        protocol: this.vizSocket.ioSocket.io.engine.protocol,
        secure: this.vizSocket.ioSocket.io.engine.secure
      });
      
      // Wait for next tick to ensure socket ID is available
      setTimeout(() => {
        const socketId = this.vizSocket.ioSocket.id;
        console.log('Socket fully initialized with ID:', socketId);
        // Request attribute distribution on connect with socket ID
        this.vizSocket.emit('request_attribute_distribution', { socketId });
        console.log('Attribute distribution request sent');
      }, 100); // Increased timeout to ensure socket is fully initialized
    });

    this.vizSocket.on('connect_error', (error) => {
      console.error('=== SOCKET CONNECTION ERROR ===');
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context
      });
      console.error('Connection details:', {
        url: this.vizSocket.ioSocket.io.uri,
        port: this.vizSocket.ioSocket.io.engine?.port || 'unknown',
        protocol: this.vizSocket.ioSocket.io.engine?.protocol || 'unknown',
        transport: this.vizSocket.ioSocket.io.engine?.transport?.name || 'unknown',
        opts: this.vizSocket.ioSocket.io.opts,
        readyState: this.vizSocket.ioSocket.io.engine?.readyState || 'unknown'
      });
      
      // Log specific error types
      if (error.message.includes('timeout')) {
        console.error('❌ CONNECTION TIMEOUT - Server may be down or unreachable');
      } else if (error.message.includes('CORS')) {
        console.error('❌ CORS ERROR - Server may not allow connections from this origin');
      } else if (error.message.includes('SSL')) {
        console.error('❌ SSL/TLS ERROR - Certificate or protocol mismatch');
      } else if (error.message.includes('network')) {
        console.error('❌ NETWORK ERROR - Check internet connection and server availability');
      } else if (error.message.includes('port')) {
        console.error('❌ PORT ERROR - Server may not be listening on expected port');
      }
      
      // Attempt to reconnect after a delay
      console.log('🔄 Attempting to reconnect in 5 seconds...');
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        this.vizSocket.connect();
      }, 5000);
    });

    this.vizSocket.on('disconnect', (reason) => {
      console.log('=== SOCKET DISCONNECTED ===');
      const socketId = this.vizSocket.ioSocket.id;
      console.log('Disconnect details:', {
        reason: reason,
        socketId: socketId,
        transport: this.vizSocket.ioSocket.io.engine?.transport?.name || 'unknown',
        url: this.vizSocket.ioSocket.io.uri
      });
      
      if (reason === 'io server disconnect') {
        console.log('🔄 Server initiated disconnect, attempting to reconnect...');
        this.vizSocket.connect();
      } else if (reason === 'io client disconnect') {
        console.log('📱 Client initiated disconnect');
      } else if (reason === 'transport close') {
        console.log('🔌 Transport connection closed');
      } else if (reason === 'ping timeout') {
        console.log('⏰ Ping timeout - server may be overloaded');
      } else if (reason === 'transport error') {
        console.log('🚨 Transport error occurred');
      }
    });

    this.vizSocket.on('error', (error) => {
      console.error('=== SOCKET ERROR ===');
      console.error('Socket error details:', {
        error: error,
        message: error.message || 'Unknown error',
        type: error.type || 'Unknown type',
        socketId: this.vizSocket.ioSocket.id,
        transport: this.vizSocket.ioSocket.io.engine?.transport?.name || 'unknown'
      });
    });

    // Listen for attribute distribution updates
    this.vizSocket.on('attribute_distribution', (data) => {
      const socketId = this.vizSocket.ioSocket.id;
      console.log('📊 Received attribute distribution for socket ID:', socketId, 'Data:', data);
      // Emit the data through the observable
      this.attributeDistributionSubject.next(data);
    });

    // Add ping/pong monitoring
    this.vizSocket.ioSocket.io.on('ping', () => {
      console.log('📡 Ping sent to server');
    });

    this.vizSocket.ioSocket.io.on('pong', (latency) => {
      console.log('📡 Pong received, latency:', latency, 'ms');
    });

    // Add transport upgrade monitoring
    this.vizSocket.ioSocket.io.on('upgrade', () => {
      console.log('⬆️ Transport upgraded');
    });

    this.vizSocket.ioSocket.io.on('upgradeError', (error) => {
      console.error('❌ Transport upgrade failed:', error);
    });

    // Now connect after setting up all event handlers
    console.log('🚀 Initiating socket connection...');
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
    console.log('Socket service: Sending question response:', response);
    console.log('Socket connection state:', this.vizSocket.ioSocket.connected);
    console.log('Socket ID:', this.vizSocket.ioSocket.id);
    
    try {
      this.vizSocket.emit("on_question_response", response);
      console.log('Socket service: Question response emitted successfully');
    } catch (error) {
      console.error('Socket service: Error emitting question response:', error);
      throw error;
    }
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