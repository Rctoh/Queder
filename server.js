if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const mainpageRouter = require('./routes/mainpage')
const accountRouter = require('./routes/account')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({limit: '10mb', extended: false}))
app.use(bodyParser.json());

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL)

const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('connected to moongoose'))

app.use('/', mainpageRouter)
app.use('/account', accountRouter)

app.listen(process.env.PORT || 3000)