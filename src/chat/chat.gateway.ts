import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Get, OnModuleInit, Post } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';



@WebSocketGateway()
export class ChatGateway implements OnModuleInit{
  @Get('/chat')
  async parte(){
    return  console.log('hola metodo get');
  }

  @WebSocketServer()
  public server: Server;

  constructor(private readonly chatService: ChatService) {}


  onModuleInit() {
    
    this.server.on('connection', (socket: Socket) => {
      //this.server.socketsJoin(socket.id);
      socket.join(socket.id)
      const { name, id } = socket.handshake.auth;
      if ( !name && !id ) {
        console.log('desconectando cliente')
        socket.on('disconnect', () => {
          this.chatService.onClientDisconnected( id );  
          this.server.emit('on-clients-changed', this.chatService.getClients());
          console.log('Cliente desconectado: ', socket.id);
        })

      }else{
        console.log('Conectado',name);
        this.chatService.onClientConnected({ id: id, name: name, socket: socket.id}); // Agregamos cliente al listaod
        this.server.emit('on-clients-changed', this.chatService.getClients()); // Listado de clientes conectados
        socket.emit('msn-welcome', 'Bienvenido al al chat'); //Mensaje de bienvenida
        this.server.emit('msn-alerta-new-user', name); //Mensaje para notificar a todos de un nuevo usuario
      }
      socket.on('ini-msn-private', data =>{
        const receptor = this.chatService.getClient(data.id_receptor);
        console.log('datos del receptor');
        console.log(receptor);
        let skt = receptor.socket;
        this.server.to(skt).emit('msn-private',{
          'tipo': 'private',
          'name':name,
          'message': data.msn,
          'date':this.chatService.getFecha(),
          'userId': id,
          'nickname_receptor': 'nada',          
        });
        this.server.to(socket.id).emit('msn-private',{
          'tipo': 'private',
          'name':name,
          'message': data.msn,
          'date':this.chatService.getFecha(),
          'userId': socket.id,
          'nickname_receptor':receptor.name,
        });
        console.log('despues del envio');
      })

      socket.on('upload-file', (data) =>{
        console.log('Archivo');
        this.server.emit('file-send',
          {
            userId: socket.id,
            message: 'Archivo',
            name: name,
            file: data,
            date : {},
          }
        )
        console.log(data);
      })
    });  
  }

  @SubscribeMessage('send-message')
  handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,) {
      const { name, id } = client.handshake.auth;
      console.log({name, message});
      if ( !message ) {
        return;
      }

      this.server.emit('on-message',{
        userId: client.id,
        message: message,
        name: name,
        date : this.chatService.getFecha(),
        tipo:'public',
        'nickname_receptor': 'none',
      })
  }

}
