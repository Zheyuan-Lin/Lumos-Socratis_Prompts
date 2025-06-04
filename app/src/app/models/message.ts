export class Message {
  appMode: string;
  appType: string;
  appLevel: string;
  chartType: string;
  interactionType: string;
  interactionDuration: number;
  interactionAt: string;
  participantId: string;
  createdAt: number;
  data: any;
  eventX: number;
  eventY: number;
  group: string;
  
} 
export class Insight {
        text: string;
        timestamp: string;
        group: string;
        participantId: string;
}
export interface Question {
  type: 'question';
  id: string;
  text: string;
  timestamp: string;
}