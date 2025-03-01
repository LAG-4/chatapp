export interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
  }
  
  export interface Chat {
    id: number;
    name: string;
    lastMessage: string;
    timestamp: Date;
  }
  
  export interface Model {
    id: string;
    name: string;
  }
  