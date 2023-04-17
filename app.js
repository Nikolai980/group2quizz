const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const events = require('events')
const timeUpEvent = new events.EventEmitter()

const questions = [
    {
        text: "1 • What became clear as the Titanic approached the iceberg?",
        time: 10,
        answers: [
            "The ship was going to be able to avoid a collision.",
            "The ship was going to collide with the iceberg.",
            "The ship was going to reverse its course.",
            "The iceberg was going to move out of the way."
        ],
        correctAnswer: "The ship was going to collide with the iceberg."
    },
    {
        text: "2 • How did the small group of passengers and crew members behave during the chaos?",
        time: 10,
        answers: [
            "They panicked and ran around the ship.",
            "They helped with the evacuation of the ship.",
            "They hid in their cabins.",
            "They remained calm and collected."
        ],
        correctAnswer: "They remained calm and collected."
    },
    {
        text: "3 • What was the reason behind the conspiracy to sink the Titanic?",
        time: 15,
        answers: [
            "To test the ship's safety features.",
            "To prevent a war.",
            "For insurance fraud.",
            "To impress political leaders."
        ],
        correctAnswer: "For insurance fraud."
    },
    {
        text: "4 • What happened to the conspirators after they were found guilty?",
        time: 20,
        answers: [
            "They were given a small fine.",
            "They were sentenced to community service.",
            "They were sentenced to life imprisonment.",
            "They were acquitted of all charges."
        ],
        correctAnswer: "They were sentenced to life imprisonment."
    },
    {
        text: "5 • What does the story of the conspiracy to sink the Titanic serve as?",
        time: 15,
        answers: [
            "A reminder of the devastating consequences of greed and corruption.",
            "A story of heroism and bravery.",
            "A cautionary tale of the dangers of exploration.",
            "A tale of triumph over tragedy."
        ],
        correctAnswer: "A reminder of the devastating consequences of greed and corruption."
    },
    {
        text: "6 • What is baked into sweets as a good luck token in Bolivia?",
        time: 10,
        answers: [
            "Pomegranate seeds",
            "Grapes",
            "Almonds",
            "Coins"
        ],
        correctAnswer: "Coins"
    },
    {
        text: "7 • which city in the U.S. do millions of people gather to watch the ball drop at midnight?",
        time: 10,
        answers: [
            "New York City, NY",
            "Washington, D.C.",
            "Austin, TX",
            "Dallas, TX"
        ],
        correctAnswer: "New York City, NY"
    },
    {
        text: "8 • Russia, people write down wishes on paper. What do they do with them afterwards?",
        time: 10,
        answers: [
            "Put them in a jar and keep it closed for a year.",
            "Burn them, throw it in a Champagne glass and drink it.",
            "Burn them in the fire place.",
            "Tie them to balloons and let them fly away."
        ],
        correctAnswer: "Burn them, throw it in a Champagne glass and drink it."
    },
    {
        text: "9 • People in Colombia believe that _____ will increase their chances to travel in the new year.",
        time: 10,
        answers: [
            "packing their suitcases by midnight",
            "making a wish on their passports",
            "buying a new suitcase by midnight",
            "running around the block with their suitcases"
        ],
        correctAnswer: "running around the block with their suitcases"
    },
    {
        text: "10 • Why do Ecuadorians burn homemade puppets at midnight?",
        time: 10,
        answers: [
            "It's a replacement for fireworks, as those are illegal.",
            "To burn away the old year and start with a clean slate.",
            "They believe puppets are evil.",
            "To protect themselves against spirits."
        ],
        correctAnswer: "To burn away the old year and start with a clean slate."
    },
]

let userPointsMap = {
    /*
    SOCKETID: ["<PLAYERNAME>", POINTS]
    Example -- 
    dfwaogruhdslfsdljf: ["Khushraj", 0]
    */
}

io.on('connection', (socket) => {
    let attempt = ""

    console.log('A user connected')
    socket.emit('connected')
    socket.once("name", (name) => {
        userPointsMap[socket.id] = [name, 0]
        io.emit("name", name)
    })

    socket.once("start", async () => {
        for (const question of questions) {
            await new Promise(async (resolve) => {
                const toSend = { ...question }

                setTimeout(() => {
                    timeUpEvent.emit("timeUp", question.correctAnswer)
                    const sortedValues = Object.values(userPointsMap).sort(([, a], [, b]) => b - a)
                    const top5 = sortedValues.slice(0, 5)

                    io.emit("timeUp", top5)

                    socket.once("next", () => {
                        resolve()
                    })
                }, question.time * 1000)

                delete toSend.correctAnswer
                io.emit('question', toSend)
            })
        }
        const sortedValues = Object.values(userPointsMap).sort(([, a], [, b]) => b - a)
        io.emit("gameover", sortedValues)
        process.exit(0)
    })

    socket.on("answer", answer => {
        attempt = answer
    })

    timeUpEvent.on("timeUp", (correctAnswer) => {
        if (attempt) {
            if (attempt === correctAnswer) {
                userPointsMap[socket.id][1]++
                socket.emit("correct")
            } else {
                socket.emit("incorrect")
            }
            attempt = ""
        } else {
            socket.emit("noAnswer")
        }
    })
})

app.use(express.static('public'))
http.listen(3000, () => {
    console.log('listening on *:3000')
})