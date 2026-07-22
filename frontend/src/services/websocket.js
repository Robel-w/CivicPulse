import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(onConnect, onError) {
        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            debug: function (str) {
                console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
            console.log('Connected: ' + frame);
            if (onConnect) onConnect();
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
            if (onError) onError(frame);
        };

        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
    }

    subscribe(destination, callback) {
        if (this.client && this.client.connected) {
            return this.client.subscribe(destination, (message) => {
                callback(JSON.parse(message.body));
            });
        }
        return null;
    }

    sendMessage(destination, body) {
        if (this.client && this.client.connected) {
            this.client.publish({
                destination: destination,
                body: JSON.stringify(body)
            });
        } else {
            console.error('STOMP client not connected');
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
