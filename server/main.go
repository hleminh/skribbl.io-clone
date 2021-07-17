package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var addr = ":6969"

var upgrader = websocket.Upgrader{
	ReadBufferSize:  0,
	WriteBufferSize: 0,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	sender  *Client
	content []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				if client != message.sender {
					select {
					case client.send <- message.content:
					default:
						delete(h.clients, client)
						close(client.send)
					}
				}
			}
		}
	}
}

// read message from ws connection and write to hub
func (c *Client) wsReadHandler() {
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Println(err)
			c.hub.unregister <- c
			return
		}
		c.hub.broadcast <- Message{c, message}
	}
}

// write message from hub to ws connection
func (c *Client) wsWriteHandler() {
	for {
		message := <-c.send
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Println(err)
			return
		}
	}
}

func serveWS(h *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}
	client := &Client{h, conn, make(chan []byte)}
	h.register <- client
	go client.wsReadHandler()
	go client.wsWriteHandler()
}

func main() {
	h := newHub()
	go h.run()

	serveMux := mux.NewRouter()

	serveMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		serveWS(h, w, r)
	})

	if err := http.ListenAndServe(addr, serveMux); err != nil {
		log.Println(err)
		panic(err)
	}
}
