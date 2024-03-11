const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port =process.env.PORT|| 5000;

app.use(cors());
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@jobseekingass.svd3yy8.mongodb.net/?retryWrites=true&w=majority&appName=JobSeekingAss`;

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


    app.get('/jobs', async(req,res)=>{
        const result = await jobsCollection.find().toArray();
        res.send(result)
    })
    app.get('/jobs/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)};
      const result = await jobsCollection.findOne(query);
      res.send(result)
    })
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
