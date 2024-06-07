import { Injectable } from '@nestjs/common';


interface Client {
  id: string;
  name: string;
  socket : string;
}

@Injectable()
export class ChatService {

  private clients: Record<string, Client> = {};

  onClientConnected( client: Client ) {
    this.clients[ client.id ] = client;
  }

  onClientDisconnected( id: string ) {
    delete this.clients[id];
    console.log(id)
  }

  
  getClients() {
    console.log(this.clients);
    return Object.values( this.clients ); 
  }




}