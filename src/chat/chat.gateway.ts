import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Get, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';



@WebSocketGateway()
export class ChatGateway implements OnModuleInit{

  @Get('parte')
  parte(){
    console.log('hola');
  }

  @WebSocketServer()
  public server: Server;

  constructor(private readonly chatService: ChatService) {}


  onModuleInit() {
    this.server.on('connection', (socket: Socket) => {
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

      const getFecha = () =>{
        let date = new Date();
        let fecha = {
          'dia_semana_letra': getDaySemana(date),
          'dia': date.getDay(),
          'mes_letra': getMes(date.getMonth()),
          'mes': date.getMonth() + 1,
          'anio': date.getFullYear(),
          'hora': parseo_num(date.getHours()),
          'minuto': parseo_num(date.getMinutes()),
          'segundo': parseo_num(date.getSeconds()),
        }
        return fecha;        
      }

      const parseo_num = (arg : any) =>{
        let valor = arg;
        if(valor < 10){
          valor = '0'+valor;
        }
        return valor;
      }
      const getDaySemana = (fecha:any) => {
        return [
          'Domingo',
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
        ][new Date(fecha).getDay()];
      }
    
      const getMes = (arg:any) =>{
        let month = arg;
        switch(arg){
          case 0 : month = 'Enero'; break;
          case 1 : month = 'Febrero'; break;
          case 2 : month = 'Marzo'; break;
          case 3 : month = 'Abril'; break;
          case 4 : month = 'Mayo'; break;
          case 5 : month = 'Junio'; break;
          case 6 : month = 'Julio'; break;
          case 7 : month = 'Agosto'; break;
          case 8 : month = 'Septiembre'; break;
          case 9 : month = 'Octubre'; break;
          case 10 : month = 'Noviembre'; break;
          case 11 : month = 'Diciembre'; break;
        }
        return month;
      }
      

      
      const { name, id } = client.handshake.auth;

      console.log({name, message});

      if ( !message ) {
        return;
      }

      this.server.emit('on-message',
        {
          userId: client.id,
          message: message,
          name: name,
          date : getFecha(),
        })
  }

}
