package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

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

type Player struct {
	Name   string `json:"name"`
	IsHost bool   `json:"isHost"`
	IsYou  bool   `json:"isYou"`
}

// external data that will be exposed to clients
type GameState struct {
	RoomURL  string   `json:"roomURL"`
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
	clients    map[*Client]bool
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	name   string
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	isHost bool
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
			data := strings.Split(string(message.content), ",")
			switch data[0] {
			case "getGameState":
				players := make([]Player, 0)
				for client := range h.clients {
					players = append(players, Player{
						Name:   client.name,
						IsHost: client.isHost,
						IsYou:  client.conn.RemoteAddr().String() == message.sender.conn.RemoteAddr().String(),
					})
				}
				gameState := GameState{
					RoomURL:  h.id,
					Rounds:   h.rounds,
					DrawTime: h.drawTime,
					Stage:    h.stage,
					Players:  players,
				}
				gameStateJSON, err := json.Marshal(gameState)
				if err != nil {
					log.Println(err)
				}
				message.sender.send <- gameStateJSON
				continue
			case "setRounds":
				rounds, _ := strconv.Atoi(data[1])
				h.rounds = rounds
			case "setDrawTime":
				drawTime, _ := strconv.Atoi(data[1])
				h.drawTime = drawTime
			case "setStage":
				h.stage = data[1]
			}
			for client := range h.clients {
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
	playerName := r.URL.Query().Get("playerName")
	if len(playerName) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}
	client := &Client{
		name:   playerName,
		hub:    h,
		conn:   conn,
		send:   make(chan []byte),
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
		log.Println(err)
		panic(err)
	}
}
