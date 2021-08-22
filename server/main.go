package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

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

var WordBank = []string{"test1", "test2", "test3"}

type Content struct {
	SenderId  int    `json:"senderId"`
	Directive string `json:"directive"`
	Data      string `json:"data,omitempty"`
}

type IncomingMessage struct {
	sender  *Client
	content Content
}

type OutgoingMessage = Content

type Player struct {
	Id     int    `json:"id"`
	Name   string `json:"name"`
	IsHost bool   `json:"isHost"`
	IsYou  bool   `json:"isYou"`
}

// external data that will be exposed to clients
type GameState struct {
	Word     string   `json:"word"`
	RoomID   string   `json:"roomID"`
	Rounds   int      `json:"rounds"`
	DrawTime int      `json:"drawTime"`
	Stage    string   `json:"stage"`
	Players  []Player `json:"players"`
}

// internal data not exposed to clients
type Hub struct {
	id         string
	hostAddr   string
	rounds     int
	drawTime   int
	stage      string
	word       string
	clients    map[*Client]bool
	broadcast  chan IncomingMessage
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	id     int
	name   string
	hub    *Hub
	conn   *websocket.Conn
	send   chan OutgoingMessage
	isHost bool
}

func (client *Client) toPlayer() Player {
	return Player{
		Id:     client.id,
		Name:   client.name,
		IsHost: client.isHost,
		IsYou:  false,
	}
}

func createOutgoingMessage(senderId int, directive string, data string) OutgoingMessage {
	return OutgoingMessage{
		SenderId:  senderId,
		Directive: directive,
		Data:      data,
	}
}

func createIncomingMessage(sender *Client, directive string, data string) IncomingMessage {
	return IncomingMessage{
		sender: sender,
		content: Content{
			Directive: directive,
			Data:      data,
		},
	}
}

type CreateRoomRequest struct {
	PlayerName string `json:"playerName"`
}

func newHub(hostAddr string) *Hub {
	return &Hub{
		hostAddr:   hostAddr,
		rounds:     3,
		drawTime:   60,
		stage:      "wait",
		word:       "",
		clients:    make(map[*Client]bool),
		broadcast:  make(chan IncomingMessage, 1),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			playerData, _ := json.Marshal(client.toPlayer())
			h.broadcast <- createIncomingMessage(client, "playerJoin", string(playerData))
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				playerId, _ := json.Marshal(client.toPlayer().Id)
				h.broadcast <- createIncomingMessage(client, "playerLeave", string(playerId))
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			switch message.content.Directive {
			case "getGameState":
				players := make([]Player, 0)
				for client := range h.clients {
					players = append(players, Player{
						Id:     client.id,
						Name:   client.name,
						IsHost: client.isHost,
						IsYou:  client.conn.RemoteAddr().String() == message.sender.conn.RemoteAddr().String(),
					})
				}
				gameState := GameState{
					RoomID:   h.id,
					Rounds:   h.rounds,
					DrawTime: h.drawTime,
					Stage:    h.stage,
					Players:  players,
				}
				gameStateJSON, err := json.Marshal(gameState)
				if err != nil {
					fmt.Println(err)
				}
				message.sender.send <- createOutgoingMessage(message.sender.id, message.content.Directive, string(gameStateJSON))
				continue
			case "getWords":
				wordBankJSON, err := json.Marshal(WordBank)
				if err != nil {
					fmt.Println(err)
				}
				message.sender.send <- createOutgoingMessage(message.sender.id, message.content.Directive, string(wordBankJSON))
				continue
			case "setWord":
				if !message.sender.isHost {
					continue
				}
				word := string(message.content.Data)
				h.word = word
				var obfuscatedWord string
				for i := 0; i < len(word); i++ {
					obfuscatedWord += "_ "
				}
				message.content.Data = string(obfuscatedWord)
			case "setRounds":
				if !message.sender.isHost {
					continue
				}
				rounds, _ := strconv.Atoi(message.content.Data)
				h.rounds = rounds
			case "setDrawTime":
				if !message.sender.isHost {
					continue
				}
				drawTime, _ := strconv.Atoi(message.content.Data)
				h.drawTime = drawTime
			case "setStage":
				if !message.sender.isHost {
					continue
				}
				h.stage = string(message.content.Data)
			}
			for client := range h.clients {
				if client != message.sender {
					select {
					case client.send <- createOutgoingMessage(message.sender.id, message.content.Directive, message.content.Data):
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
			fmt.Println(err)
			c.hub.unregister <- c
			return
		}
		var parsedMessage OutgoingMessage
		err = json.Unmarshal(message, &parsedMessage)
		fmt.Println(parsedMessage)
		if err != nil {
			fmt.Println(err)
		}
		c.hub.broadcast <- IncomingMessage{sender: c, content: parsedMessage}
	}
}

// write message from hub to ws connection
func (c *Client) wsWriteHandler() {
	for {
		message := <-c.send
		if err := c.conn.WriteJSON(message); err != nil {
			fmt.Println(err)
			return
		}
	}
}

func serveWS(h *Hub, w http.ResponseWriter, r *http.Request) {
	playerName := r.URL.Query().Get("playerName")
	if len(playerName) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
	}
	client := &Client{
		id:     len(h.clients),
		name:   playerName,
		hub:    h,
		conn:   conn,
		send:   make(chan OutgoingMessage),
		isHost: len(h.clients) == 0,
	}
	h.register <- client
	go client.wsReadHandler()
	go client.wsWriteHandler()
}

func main() {

	hubs := make(map[string]*Hub)

	serveMux := mux.NewRouter()

	serveMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		h := newHub(r.RemoteAddr)
		go h.run()
		id := strconv.Itoa(len(hubs))
		hubs[id] = h
		h.id = id
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Write([]byte(id))
	}).Methods(http.MethodPost)

	serveMux.HandleFunc("/{rid}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		_, ok := hubs[vars["rid"]]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}
	}).Methods(http.MethodOptions)

	serveMux.HandleFunc("/{rid}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		h, ok := hubs[vars["rid"]]
		if !ok {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		serveWS(h, w, r)
	}).Methods(http.MethodGet)

	if err := http.ListenAndServe(addr, serveMux); err != nil {
		fmt.Println(err)
		panic(err)
	}
}
