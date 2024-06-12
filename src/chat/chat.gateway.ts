import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Get, OnModuleInit, Post } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

let room ='sala_general';

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
      socket.join(room);
      const { name, id } = socket.handshake.auth;
      if ( !name && !id ) {
        console.log('desconectando cliente')
        socket.on('disconnect', () => {
          this.chatService.onClientDisconnected( id );
          this.server.emit('on-clients-changed', this.chatService.getClients());
          this.server.emit('room_activas', this.chatService.getRoom());
          console.log('Cliente desconectado: ', socket.id);
        })

      }else{
        console.log('Conectado',name);
        this.chatService.onClientConnected({ id: id, name: name, socket: socket.id}); // Agregamos cliente al listaod
        this.server.emit('on-clients-changed', this.chatService.getClients()); // Listado de clientes conectados
        this.server.emit('room_activas', this.chatService.getRoom());
        socket.emit('msn-welcome', 'Bienvenido al al chat'); //Mensaje de bienvenida
        this.server.emit('msn-alerta-new-user', name); //Mensaje para notificar a todos de un nuevo usuario
      }

      socket.emit('room', this.chatService.getRoom());
      
      socket.on('joinroom', data =>{
        socket.join(room);
        console.log('Datos de Joinroom')
        console.log(data);
        this.server.to(data.room_id_close).emit('room_close',{
          'tipo': 'general_off',
          'name':name,
          'message': name + ' ha dejado la '+data.room_close,
          'date':this.chatService.getFecha(),
          'userId': id,
          'room':data.room_close_id,
          'nickname_receptor': 'none',
          });
          
        room = data.id;
        socket.join(room);
        this.server.to(room).emit('room_connect', {
          'tipo': 'general_on',
          'name':name,
          'message':name + ' ha ingresado a '+data.room,
          'date':this.chatService.getFecha(),
          'userId': id,
          'room':room,
          'nickname_receptor': 'none',
          });
      })

      socket.on('create-room-private', (data) =>{
        //crear sala
        this.chatService.setRoom(data.room);
        this.server.emit('room_activas', this.chatService.getRoom());
      })

      socket.on('ini-msn-private', data =>{
        const receptor = this.chatService.getClient(data.id_receptor);
        let skt = receptor.socket;
        this.server.to(skt).emit('solicitud-chat-privated',{
          'tipo': 'private',
          'name':name,
          'message': data.msn,
          'date':this.chatService.getFecha(),
          'userId': id,
          'room':name,
          'nickname_receptor': 'none',
        });
        // this.server.to(socket.id).emit('msn-private',{
        //   'tipo': 'private',
        //   'name':name,
        //   'message': data.msn,
        //   'date':this.chatService.getFecha(),
        //   'userId': socket.id,
        //   'room':receptor.name,
        //   'nickname_receptor':receptor.name,
        // });
        console.log('despues del envio');
      })

    //   socket.on('upload-file', (data) =>{
    //     console.log('Archivo');
    //     this.server.emit('file-send',
    //       {
    //         userId: socket.id,
    //         message: 'Archivo',
    //         name: name,
    //         file: data,
    //         date : {},
    //       }
    //     )
    //     console.log(data);
    //   })
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
      let msn = {
        userId: client.id,
        message: message,
        name: name,
        date : this.chatService.getFecha(),
        tipo:'public',
        room: room,
        'nickname_receptor': 'none',
        }
      this.chatService.setMensaje(msn);
      this.server.to(room).emit('on-message',this.chatService.getMensaje())
  }

}