const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 5000;

//middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster1.4gey7ap.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1"`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // client.connect();

    const donationCollectionPost = client
      .db("donationDB")
      .collection("donation-post");

    //post
    app.post("/create-donation", async (req, res) => {
      const data = req.body;
      const result = await donationCollectionPost.insertOne(data);
      res.send(result);
    });

    //get
    app.get("/donations", async (req, res) => {
      const getData = donationCollectionPost.find();
      const result = await getData.toArray();
      res.send(result);
    });

    //getbyid
    app.get("/donations/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationCollectionPost.findOne(query);
      res.send(result);
    });

    //put
    app.put("/update-donation-post/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatePost = req.body;
      const updateDoc = {
        $set: {
          title: updatePost.title,
          image: updatePost.image,
          category: updatePost.category,
          amount: updatePost.amount,
          description: updatePost.description,
        },
      };
      const options = { upsert: true };
      const result = await donationCollectionPost.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //delete
    app.delete("/donation-post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationCollectionPost.deleteOne(query);
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("Hello World!");
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
