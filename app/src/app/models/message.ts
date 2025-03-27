export class Message {
  interactionAt: number;
  interactionDuration: number;
  appType: string;
  appLevel: string;
  appMode: string;
  chartType: string;
  interactionType: string;
  participantId: string;
  data: object;
}

export interface Question {
  type: 'question';
  id: string;
  text: string;
  timestamp: string;
}
