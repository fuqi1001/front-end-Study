import { Injectable } from '@angular/core';

@Injectable()
export class MessageService {
  messages: string[] = [];
  add(messages : string) {
    this.messages.push(messages);
  }

  clear() {
    this.messages = [];
  }
  constructor() { }

}
