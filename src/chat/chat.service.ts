import { Injectable } from '@nestjs/common';


interface Client {
  id: string;
  name: string;
  socket : string;
}

let room_activas = [
  {'room':'Chat principal', 'id':'general', 'tipo':'public', 'show':true, 'participante':''},
  {'room':'Sala 1', 'id':'sala_1', 'tipo':'public', 'show':false, 'participante':''},
];

let MensajeBackup = [];

@Injectable()
export class ChatService {
  
  private clients: Record<string, Client> = {};

  onClientConnected( client: Client ) {
    this.clients[ client.id ] = client;
  }

  onClientDisconnected( id: string ) {
    delete this.clients[id];
  }

  getRoom = () =>{
    return room_activas;
  }
  setRoom = (arg) =>{
    room_activas.push(arg);
  }

  getClient(id : string) {
    return Object.values(this.clients).find(elm => elm.id === id); 
  }
  
  getClients() {
    console.log(this.clients);
    return Object.values( this.clients ); 
  }

  setMensaje(arg:any) {
    MensajeBackup.push(arg);
  }
  getMensaje(){
    return MensajeBackup[MensajeBackup.length -1];
  }
  getMensajeAll(id:any){
    return  MensajeBackup.filter((elm) => elm.userId === id)
  }
 
  getFecha = () =>{
    let date = new Date();
    let fecha = {
      'dia_semana_letra': this.getDaySemana(date),
      'dia': date.getDay(),
      'mes_letra': this.getMes(date.getMonth()),
      'mes': date.getMonth() + 1,
      'anio': date.getFullYear(),
      'hora': this.parseoNum(date.getHours()),
      'minuto': this.parseoNum(date.getMinutes()),
      'segundo': this.parseoNum(date.getSeconds()),
    }
    return fecha;        
  }

  getMes = (arg: any) =>{
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

  getDaySemana = (fecha:any) => {
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

  parseoNum = (arg : any) =>{
    let valor = arg;
    if(valor < 10){
      valor = '0'+valor;
    }
    return valor;
  }

}