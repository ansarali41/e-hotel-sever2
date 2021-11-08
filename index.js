const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const objectId = require('mongodb').ObjectID;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yf6o8.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('orders'));
app.use(fileUpload());

// root
app.get('/', (req, res) => {
    res.send("hello from db it's working working");
});

// mongodb
client.connect(err => {
    const ordersCollection = client.db('eHotel').collection('orders');
    const reviewsCollection = client.db('eHotel').collection('reviews');
    const adminsCollection = client.db('eHotel').collection('admins');
    const servicesCollection = client.db('eHotel').collection('services');

    // user section
    // add Order by user
    app.post('/addOrder', (req, res) => {
        const { name, email, address, date, phone, status, title, price } = req.body;
        // const file = req.files.file;
        // const newImg = file.data;
        // const encImg = newImg.toString('base64');

        // var image = {
        //     contentType: file.mimetype,
        //     size: file.size,
        //     img: Buffer.from(encImg, 'base64'),
        // };

        ordersCollection.insertOne({ name, email, address, date, phone, status, title, price }).then(result => {
            res.send(result.insertedCount > 0);
        });
    });

    // user services only
    app.get('/serviceList/:email', (req, res) => {
        const userEmail = req.params.email;
        ordersCollection.find({ email: userEmail }).toArray((err, documents) => {
            res.send(documents);
        });
    });

    // add review by user
    app.post('/addReview', (req, res) => {
        const review = req.body;
        reviewsCollection.insertOne(review).then(result => {
            res.send(result.insertedCount > 0);
        });
    });

    // get all reviews at home page
    app.get('/reviews', (req, res) => {
        reviewsCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    // admin section
    // all service get for admin in service list table
    app.get('/allService', (req, res) => {
        ordersCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    // make a admin
    app.post('/makeAdmin', (req, res) => {
        const email = req.body.email;
        adminsCollection.insertOne({ email: email }).then(result => {
            res.send(result.insertedCount > 0);
        });
    });

    // check is admin or not
    app.get('/isAdmin/:email', (req, res) => {
        const email = req.params.email;
        adminsCollection.find({ email: email }).toArray((err, documents) => {
            res.send(documents);
        });
    });

    // add service by admin
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const { title, description, price } = req.body;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64'),
        };

        servicesCollection.insertOne({ title, description, image, price }).then(result => {
            res.send(result.insertedCount > 0);
        });
    });

    // all service show to home page
    app.get('/loadServices', (req, res) => {
        servicesCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    // update service status
    app.patch('/updateStatus/:id', (req, res) => {
        ordersCollection
            .updateOne(
                { _id: objectId(req.params.id) },
                {
                    $set: { status: req.body.serviceStatus },
                },
            )
            .then(result => {
                res.send(result.modifiedCount > 0);
            });
    });
    // delete from
    app.delete('/deleteService/:id', (req, res) => {
        const id = req.params.id;
        ordersCollection.deleteOne({ _id: objectId(req.params.id) }).then(result => {
            res.send(result.deletedCount > 0);
        });
    });
});

const port = 5000;
app.listen(process.env.PORT || port);
