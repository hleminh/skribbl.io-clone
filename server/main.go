package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type Content struct {
	SenderID int    `json:"senderId,omitempty"`
	Type     string `json:"type"`
	Data     string `json:"data,omitempty"`
}

type IncomingMessage struct {
	sender  *Client
	content *Content
}

type OutgoingMessage = Content

type Player struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	IsHost     bool   `json:"isHost"`
	IsYou      bool   `json:"isYou"`
	IsDrawing  bool   `json:"isDrawing"`
	IsGuessed  bool   `json:"isGuessed"`
	TurnScore  int    `json:"turnScore"`
	RoundScore int    `json:"roundScore"`
	GameScore  int    `json:"gameScore"`
}

// external data that will be exposed to clients
type GameState struct {
	Word         string   `json:"word"`
	LobbyID      string   `json:"lobbyID"`
	Rounds       int      `json:"rounds"`
	DrawTime     int      `json:"drawTime"`
	LobbyState   string   `json:"lobbyState"`
	RoundState   string   `json:"roundState"`
	Players      []Player `json:"players"`
	CurrentRound int      `json:"currentRound"`
}

// internal data not exposed to clients
type Hub struct {
	id           string
	rounds       int
	drawTime     int
	lobbyState   string
	roundState   string
	word         string
	revealReason string
	currentRound int
	clients      map[*Client]bool
	broadcast    chan IncomingMessage
	register     chan *Client
	unregister   chan *Client
	timer        *CustomTimer
}

type Client struct {
	id         int
	name       string
	hub        *Hub
	conn       *websocket.Conn
	send       chan OutgoingMessage
	isHost     bool
	isDrawing  bool
	isGuessed  bool
	hasDrawn   bool
	turnScore  int
	roundScore int
	gameScore  int
}

type CustomTimer struct {
	*time.Timer
	abort chan bool
	end   chan bool
}

type PlayerScore struct {
	Name       string `json:"name"`
	IsYou      bool   `json:"isYou"`
	TurnScore  int    `json:"turnScore"`
	RoundScore int    `json:"roundScore"`
	GameScore  int    `json:"gameScore"`
}

type Summary struct {
	Word   string        `json:"word"`
	Reason string        `json:"reason"`
	Scores []PlayerScore `json:"scores"`
}

type CreateRoomRequest struct {
	PlayerName string `json:"playerName"`
}

func newCustomTimer(seconds int) *CustomTimer {
	return &CustomTimer{
		time.NewTimer(time.Duration(seconds) * time.Second),
		make(chan bool),
		make(chan bool),
	}
}

func (client *Client) toPlayer() Player {
	return Player{
		ID:         client.id,
		Name:       client.name,
		IsHost:     client.isHost,
		IsYou:      false,
		IsDrawing:  client.isDrawing,
		IsGuessed:  client.isGuessed,
		TurnScore:  client.turnScore,
		RoundScore: client.roundScore,
		GameScore:  client.gameScore,
	}
}

func createOutgoingMessage(sender *Client, messageType string, data string) OutgoingMessage {
	var senderID int
	if sender == nil {
		senderID = 0
	} else {
		senderID = sender.id
	}
	return OutgoingMessage{
		SenderID: senderID,
		Type:     messageType,
		Data:     data,
	}
}

func createIncomingMessage(sender *Client, messageType string, data string) IncomingMessage {
	return IncomingMessage{
		sender: sender,
		content: &Content{
			Type: messageType,
			Data: data,
		},
	}
}

func newHub() *Hub {
	return &Hub{
		rounds:       3,
		drawTime:     60,
		lobbyState:   "wait",
		roundState:   "unset",
		word:         "",
		currentRound: 1,
		clients:      make(map[*Client]bool),
		broadcast:    make(chan IncomingMessage, 5),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
	}
}

func (h *Hub) start() {
	h.roundState = "ongoing"
	h.broadcast <- createIncomingMessage(nil, "roundOngoing", "")
	h.timer = newCustomTimer(h.drawTime)
	h.revealReason = "timeOut"
	select {
	case <-h.timer.C:
	case <-h.timer.end:
		h.timer.Stop()
	case <-h.timer.abort:
		h.timer.Stop()
		return
	}
	if h.broadcast != nil {
		if len(h.getDrawnClients()) == len(h.clients) {
			if h.currentRound < h.rounds {
				h.broadcast <- createIncomingMessage(nil, "roundReveal", "")
			} else {
				h.broadcast <- createIncomingMessage(nil, "lobbyReveal", "")
			}
		} else {
			h.broadcast <- createIncomingMessage(nil, "roundTurnReveal", "")
		}
	}
}

func (h *Hub) getHost() *Client {
	for client := range h.clients {
		if client.isHost {
			return client
		}
	}
	return nil
}

func (h *Hub) getDrawingClient() *Client {
	for client := range h.clients {
		if client.isDrawing {
			return client
		}
	}
	return nil
}

func (h *Hub) getPlayers(requester *Client) []Player {
	players := make([]Player, 0)
	for client := range h.clients {
		var isYou bool
		if requester == nil {
			isYou = false
		} else {
			isYou = client.conn.RemoteAddr().String() == requester.conn.RemoteAddr().String()
		}
		players = append(players, Player{
			ID:         client.id,
			Name:       client.name,
			IsHost:     client.isHost,
			IsYou:      isYou,
			IsDrawing:  client.isDrawing,
			TurnScore:  client.turnScore,
			RoundScore: client.roundScore,
			GameScore:  client.gameScore,
		})
	}
	return players
}

func (h *Hub) getGuessedClients() []*Client {
	clients := make([]*Client, 0)
	for client := range h.clients {
		if client.isGuessed {
			clients = append(clients, client)
		}
	}
	return clients
}

func (h *Hub) getClientById(id int) *Client {
	for client := range h.clients {
		if client.id == id {
			return client
		}
	}
	return nil
}

func (h *Hub) getDrawnClients() []*Client {
	clients := make([]*Client, 0)
	for client := range h.clients {
		if client.hasDrawn {
			clients = append(clients, client)
		}
	}
	return clients
}

func (h *Hub) resetDrawnClients() {
	for client := range h.clients {
		client.hasDrawn = false
	}
}

func (h *Hub) getRandomNotDrawnClients() *Client {
	// every iteration of map is random so the result is also random
	for client := range h.clients {
		if !client.hasDrawn {
			return client
		}
	}
	return nil
}

func (h *Hub) getPlayerScores(requester *Client) []PlayerScore {
	playerScores := make([]PlayerScore, 0)
	for client := range h.clients {
		var isYou bool
		if requester == nil {
			isYou = false
		} else {
			isYou = client.conn.RemoteAddr().String() == requester.conn.RemoteAddr().String()
		}
		playerScores = append(playerScores, PlayerScore{
			Name:       client.name,
			IsYou:      isYou,
			TurnScore:  client.turnScore,
			RoundScore: client.roundScore,
			GameScore:  client.gameScore,
		})
	}
	return playerScores
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			player, _ := json.Marshal(client.toPlayer())
			h.broadcast <- createIncomingMessage(nil, "playerJoin", string(player))
			if h.lobbyState == "play" {
				h.broadcast <- createIncomingMessage(nil, "info", fmt.Sprintf("%s joined the game", client.name))
			}
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				h.broadcast <- createIncomingMessage(nil, "playerLeave", fmt.Sprint(client.id))
				if h.lobbyState == "play" {
					h.broadcast <- createIncomingMessage(nil, "alert", fmt.Sprintf("%s left the game", client.name))
				}
				delete(h.clients, client)
				close(client.send)
				if h.roundState != "wait" && h.roundState != "unset" {
					if client.isDrawing && len(h.clients) > 1 {
						h.revealReason = "drawerLeave"
						if h.roundState == "ongoing" {
							h.timer.abort <- true
							h.broadcast <- createIncomingMessage(nil, "roundTurnReveal", "")
						} else {
							clientToDrawn := h.getRandomNotDrawnClients()
							if clientToDrawn != nil {
								h.broadcast <- createIncomingMessage(nil, "playerDrawing", fmt.Sprint(clientToDrawn.id))
							}
						}
					}
				}
			}
		case message := <-h.broadcast:
			switch message.content.Type {
			case "getGameState":
				gameState := GameState{
					LobbyID:      h.id,
					Rounds:       h.rounds,
					DrawTime:     h.drawTime,
					LobbyState:   h.lobbyState,
					RoundState:   h.roundState,
					Players:      h.getPlayers(message.sender),
					CurrentRound: h.currentRound,
				}
				gameStateJSON, err := json.Marshal(gameState)
				if err != nil {
					fmt.Println(err)
				}
				message.sender.send <- createOutgoingMessage(nil, "setGameState", string(gameStateJSON))
				continue
			case "getWordChoices":
				if !message.sender.isDrawing {
					continue
				}
				wordChoices := get3RandomNouns()
				wordChoicesJSON, err := json.Marshal(wordChoices)
				if err != nil {
					fmt.Println(err)
				}
				message.sender.send <- createOutgoingMessage(nil, "setWordChoices", string(wordChoicesJSON))
				continue
			case "chooseWord":
				if !message.sender.isDrawing {
					continue
				}
				word := string(message.content.Data)
				h.word = word
				var obfuscatedWord string
				for i := 0; i < len(word); i++ {
					obfuscatedWord += "_ "
				}
				obfuscatedWord = strings.TrimSpace(obfuscatedWord)
				message.content.Type = "setWord"
				message.content.Data = obfuscatedWord
				go h.start()
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
			case "startGame":
				if !message.sender.isHost || len(h.clients) < 2 {
					continue
				}
				h.broadcast <- createIncomingMessage(nil, "lobbyPlay", "")
				continue
			case "lobbyWait":
				h.lobbyState = "wait"
			case "lobbyPlay":
				h.lobbyState = "play"
				clientToDraw := h.getRandomNotDrawnClients()
				fmt.Println(clientToDraw)
				h.broadcast <- createIncomingMessage(nil, "playerDrawing", fmt.Sprint(clientToDraw.id))
				h.broadcast <- createIncomingMessage(nil, "roundChooseWord", "")
			case "roundChooseWord":
				h.roundState = "chooseWord"
			case "roundReveal":
				h.roundState = "reveal"
			case "roundTurnReveal":
				h.roundState = "turnReveal"
				h.broadcast <- createIncomingMessage(nil, "info", fmt.Sprintf("The word was '%s'", h.word))
			case "startNextRound":
				h.currentRound += 1
				if h.currentRound > h.rounds {
					h.broadcast <- createIncomingMessage(nil, "lobbyReveal", "")
					continue
				}
				h.roundState = "chooseWord"
				h.nextRound()
				continue
			case "startNextTurn":
				if h.currentRound > h.rounds {
					h.broadcast <- createIncomingMessage(nil, "lobbyReveal", "")
					continue
				}
				h.roundState = "chooseWord"
				h.nextTurn()
				continue
			case "chat":
				if message.content.Data == "" {
					continue
				}
				if message.content.Data == h.word && !message.sender.isDrawing && !message.sender.isGuessed {
					message.sender.turnScore += 500
					message.sender.roundScore += message.sender.turnScore
					message.sender.gameScore += message.sender.roundScore
					message.sender.isGuessed = true
					drawer := h.getDrawingClient()
					drawer.turnScore += 100
					drawer.roundScore += drawer.turnScore
					drawer.gameScore += drawer.roundScore
					h.broadcast <- createIncomingMessage(nil, "playerGuessed", fmt.Sprint(message.sender.id))
					message.sender.send <- createOutgoingMessage(nil, "wordReveal", h.word)
					if len(h.getGuessedClients()) == len(h.clients)-1 {
						h.revealReason = "allGuessed"
						h.timer.end <- true
					}
					continue
				}
				if message.sender.isGuessed || message.sender.isDrawing {
					message.content.Type = "guessedChat"
				}
			case "playerGuessed":
				playerId, err := strconv.Atoi(message.content.Data)
				if err != nil {
					fmt.Println(err)
				}
				client := h.getClientById(playerId)
				h.broadcast <- createIncomingMessage(nil, "notify", fmt.Sprintf("%s guessed the word!", client.name))
			case "playerDrawing":
				playerId, err := strconv.Atoi(message.content.Data)
				if err != nil {
					fmt.Println(err)
				}
				client := h.getClientById(playerId)
				client.isDrawing = true
				client.hasDrawn = true
				h.broadcast <- createIncomingMessage(nil, "info", fmt.Sprintf("%s is drawing!", client.name))
			case "getSummary":
				data := Summary{
					Word:   h.word,
					Reason: h.revealReason,
					Scores: h.getPlayerScores(message.sender),
				}
				dataJSON, err := json.Marshal(data)
				if err != nil {
					fmt.Println(err)
				}
				message.sender.send <- createOutgoingMessage(nil, "setSummary", string(dataJSON))
				continue
			}
			for client := range h.clients {
				if client != message.sender {
					if message.content.Type == "guessedChat" && !client.isGuessed && !client.isDrawing {
						continue
					}
					select {
					case client.send <- createOutgoingMessage(message.sender, message.content.Type, message.content.Data):
					default:
						// 	delete(h.clients, client)
						// 	close(client.send)
					}
				}
			}
			if ((len(h.clients) < 2 && h.roundState != "wait" && h.roundState != "unset") || h.getHost() == nil) && len(h.broadcast) == 0 {
				fmt.Println("close hub")
				if len(h.clients) < 2 {
					h.revealReason = "notEnoughPlayers"
				}
				if h.getHost() == nil {
					h.revealReason = "hostLeave"
				}
				for c := range h.clients {
					delete(h.clients, c)
					close(c.send)
				}
				close(h.register)
				close(h.unregister)
				close(h.broadcast)
				h.register = nil
				h.unregister = nil
				h.broadcast = nil
				delete(hubs, h.id)
				return
			}
		}
	}
}

func (h *Hub) nextRound() {
	h.resetDrawnClients()
	clientToDrawn := h.getRandomNotDrawnClients()
	clientToDrawn.isDrawing = true
	clientToDrawn.hasDrawn = true
	for client := range h.clients {
		client.isGuessed = false
		client.hasDrawn = client.id == clientToDrawn.id
		client.isDrawing = client.id == clientToDrawn.id
		client.turnScore = 0
		client.roundScore = 0
		players := make([]Player, 0)
		for inner := range h.clients {
			players = append(players, Player{
				ID:         inner.id,
				Name:       inner.name,
				IsHost:     inner.isHost,
				IsGuessed:  false,
				IsYou:      inner.id == client.id,
				IsDrawing:  inner.id == clientToDrawn.id,
				TurnScore:  0,
				RoundScore: 0,
				GameScore:  inner.gameScore,
			})
		}
		gameState := GameState{
			LobbyID:      h.id,
			Word:         "",
			Rounds:       h.rounds,
			DrawTime:     h.drawTime,
			LobbyState:   h.lobbyState,
			RoundState:   h.roundState,
			Players:      players,
			CurrentRound: h.currentRound,
		}
		gameStateJSON, err := json.Marshal(gameState)
		if err != nil {
			fmt.Println(err)
		}
		client.send <- createOutgoingMessage(nil, "setGameState", string(gameStateJSON))
	}
	h.broadcast <- createIncomingMessage(nil, "info", fmt.Sprintf("%s is drawing!", clientToDrawn.name))
}

func (h *Hub) nextTurn() {
	clientToDrawn := h.getRandomNotDrawnClients()
	clientToDrawn.isDrawing = true
	clientToDrawn.hasDrawn = true
	for client := range h.clients {
		client.isGuessed = false
		if client.id != clientToDrawn.id {
			client.isDrawing = false
		}
		client.turnScore = 0
		players := make([]Player, 0)
		for inner := range h.clients {
			players = append(players, Player{
				ID:         inner.id,
				Name:       inner.name,
				IsHost:     inner.isHost,
				IsGuessed:  false,
				IsYou:      inner.id == client.id,
				IsDrawing:  inner.id == clientToDrawn.id,
				TurnScore:  0,
				RoundScore: inner.roundScore,
				GameScore:  inner.gameScore,
			})
		}
		gameState := GameState{
			LobbyID:      h.id,
			Word:         "",
			Rounds:       h.rounds,
			DrawTime:     h.drawTime,
			LobbyState:   h.lobbyState,
			RoundState:   h.roundState,
			Players:      players,
			CurrentRound: h.currentRound,
		}
		gameStateJSON, err := json.Marshal(gameState)
		if err != nil {
			fmt.Println(err)
		}
		client.send <- createOutgoingMessage(nil, "setGameState", string(gameStateJSON))
	}
	h.broadcast <- createIncomingMessage(nil, "info", fmt.Sprintf("%s is drawing!", clientToDrawn.name))
}

// read message from ws connection and write to hub
func (c *Client) wsReadHandler() {
	for {
		var parsedMessage OutgoingMessage
		err := c.conn.ReadJSON(&parsedMessage)
		if err != nil {
			fmt.Println(err)
			if c.hub != nil {
				c.hub.unregister <- c
			}
			fmt.Println("close read handler")
			return
		}
		fmt.Println(parsedMessage)
		c.hub.broadcast <- IncomingMessage{sender: c, content: &parsedMessage}
	}
}

// write message from hub to ws connection
func (c *Client) wsWriteHandler() {
	for {
		message, ok := <-c.send
		if !ok {

			revealReason := c.hub.revealReason
			if revealReason == "" {
				revealReason = "connectionError"
			}
			closeMsg := websocket.FormatCloseMessage(websocket.CloseInternalServerErr, c.hub.revealReason)
			if err := c.conn.WriteMessage(websocket.CloseMessage, closeMsg); err != nil {
				fmt.Println(err)
			}
			c.hub = nil
			c.conn.Close()
			fmt.Println("close write handler")
			return
		}
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
		id:        len(h.clients) + 1, // id = 0 is reserved for the hub
		name:      playerName,
		hub:       h,
		conn:      conn,
		send:      make(chan OutgoingMessage, 5),
		isDrawing: false,
		isGuessed: false,
		hasDrawn:  false,
		isHost:    len(h.clients) == 0,
	}
	h.register <- client
	go client.wsReadHandler()
	go client.wsWriteHandler()
}

var hubs = make(map[string]*Hub)

var AllowedOrigin = "*"

var addr = ":8080"

var upgrader = websocket.Upgrader{
	ReadBufferSize:  0,
	WriteBufferSize: 0,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var WordBank = []string{"test1", "test2", "test3"}

func get3RandomNouns() [3]string {
	resp, err := http.Get("https://random-word-form.herokuapp.com/random/noun?count=3")
	if err != nil {
		fmt.Println(err)
	}
	body, err := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	if err != nil {
		fmt.Println(err)
	}
	res := [3]string{}
	err = json.Unmarshal(body, &res)
	if err != nil {
		fmt.Println(err)
	}
	return res
}

func main() {
	serveMux := mux.NewRouter()

	serveMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Number of existing goroutines: %d\n", runtime.NumGoroutine())
		h := newHub()
		go h.run()
		fmt.Println(hubs)
		id := strconv.Itoa(len(hubs))
		hubs[id] = h
		h.id = id
		w.Header().Set("Access-Control-Allow-Origin", AllowedOrigin)
		w.Write([]byte(id))
	}).Methods(http.MethodPost)

	serveMux.HandleFunc("/{rid}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		hub, ok := hubs[vars["rid"]]
		if !ok || hub.lobbyState != "wait" {
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
