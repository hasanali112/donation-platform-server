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

    const paymentCollection = client.db("donationDB").collection("payment");
    const userCollection = client.db("donationDB").collection("user");
    const newsCollection = client.db("donationDB").collection("new");
    const ambassadorPaymentCollection = client
      .db("donationDB")
      .collection("ambassadorPayment");

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

    app.post("/donation-pay", async (req, res) => {
      try {
        const donationData = req.body;
        const result = await paymentCollection.insertOne(donationData);
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });
    app.get("/payments", async (req, res) => {
      try {
        const result = await paymentCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.post("/create-user", async (req, res) => {
      try {
        const userData = req.body;
        const email = userData.email;
        const userFind = await userCollection.findOne({ email: email });
        if (!userFind) {
          const result = await userCollection.insertOne(userData);
          res.send(result);
        } else {
          res.send("Email already exist");
        }
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email, role: "admin" };
        const options = {
          projection: { email: 1, _id: 0 }, // Excludes _id and includes email
        };
        const result = await userCollection.findOne(query, options);
        if (result) {
          res.send(result);
        } else {
          res.send("User is not admin");
        }
      } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred while fetching the user.");
      }
    });

    app.get("/users-role", async (req, res) => {
      try {
        let query = {};
        if (req.query.role && req.query.role !== "all") {
          query.role = req.query.role;
        }
        const result = await userCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/single-users/:email", async (req, res) => {
      try {
        const email = req.params.email; // Use req.params.email for route parameters
        const result = await userCollection.findOne({ email: email });
        res.send(result);
      } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
      }
    });

    app.patch("/user-role-change/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateData = req.body;
      const update = {
        $set: {
          role: updateData.role,
        },
      };
      const result = await userCollection.updateOne(query, update);
      res.send(result);
    });

    app.put("/update-user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatePost = req.body;
      const updateDoc = {
        $set: {
          name: updatePost.name,
          photo: updatePost.photo,
          userName: updatePost.userName,
          about: updatePost.about,
        },
      };
      const options = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.patch("/favourite-post/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatePost = req.body;
      console.log(updatePost);
      const updateDoc = {
        $set: {
          favourite: updatePost.favourite,
        },
      };

      const result = await donationCollectionPost.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/get-all-state", async (req, res) => {
      try {
        const totalUser = await userCollection.countDocuments({});
        const totalCampain = await donationCollectionPost.countDocuments({});
        const totalBlog = await newsCollection.countDocuments({});
        const result = {
          totalUser: totalUser,
          totalCampain: totalCampain,
          totalBlog: totalBlog,
        };
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/amount-calculation", async (req, res) => {
      const result = await paymentCollection
        .aggregate([
          {
            $group: {
              _id: "$month",
              totalAmount: { $sum: { $toDouble: "$amount" } },
            },
          },
        ])
        .toArray();

      res.send(result);
    });

    app.post("/create-news", async (req, res) => {
      try {
        const newsData = req.body;
        const result = await newsCollection.insertOne(newsData);
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/news", async (req, res) => {
      try {
        const result = await newsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/news/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await newsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.post("/ambassador-payment", async (req, res) => {
      try {
        const paymentData = req.body;
        const result = await ambassadorPaymentCollection.insertOne(paymentData);
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/payments-history", async (req, res) => {
      try {
        const result = await ambassadorPaymentCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
    });

    app.get("/user-donation-payments/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await paymentCollection.find({ email: email }).toArray();
        res.send(result);
      } catch (error) {
        console.log(error.message);
      }
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
