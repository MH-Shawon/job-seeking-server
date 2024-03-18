const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "https://job-seeking-cb1ed.web.app",
      "https://job-seeking-cb1ed.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jobseekingass.svd3yy8.mongodb.net/?retryWrites=true&w=majority&appName=JobSeekingAss`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const jobsCollection = client.db("JobSeeking").collection("AllJobs");
    const appliedJobsCollection = client
      .db("JobSeeking")
      .collection("appliedJob");
    const addJobsCollection = client.db("JobSeeking").collection("addJob");

    // jwt related api

    const verifyToken = async (req, res, next) => {
      const {token} = req.cookies;
      if (!token) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.user = decoded;
        next();
      });
    };

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.get("/api/v1/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // apply for a job
    app.post("/api/v1/appliedJob", async (req, res) => {
      const job = req.body;
      const result = await appliedJobsCollection.insertOne(job);
      res.send(result);
    });

    app.get("/api/v1/appliedJobs", verifyToken, async (req, res) => {
      const queryEmail = req.query?.email;
      const tokenEmail = req.user?.email;
      console.log(queryEmail, tokenEmail);
      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await appliedJobsCollection.find(query).toArray();
      res.send(result);
    });

    // add a job to db
    app.post("/api/v1/addJobs", async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });

    app.get("/api/v1/addJobs", verifyToken, async (req, res) => {
      const queryEmail = req.query?.email;
      const tokenEmail = req.user?.email;
      console.log(queryEmail, tokenEmail);
      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      let query = {};

      if (req.query?.email) {
        query = { loggedInUserEmail: req.query.email };
      }

      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    // delete jobs

    app.delete("/api/v1/addJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await addJobsCollection.deleteOne(query);
      res.send(result);
    });

    // for update get one job by id
    app.get("/api/v1/addJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addJobsCollection.findOne(query);
      res.send(result);
    });

    app.put("/api/v1/updateJobs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBooking = req.body;
      const booking = {
        $set: {
          ...updatedBooking,
        },
      };
      const result = await addJobsCollection.updateOne(
        filter,
        booking,
        options
      );
      res.send(result);
    });

    client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Job seekers!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
