const express = require("express");
const app = express();
const cors = require("cors");
const port = 5000;
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;
app.use(express.json());
app.use(cors());
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
    // Connect the client to the server	(optional starting in v4.7)
    const db = client.db("HireLoopDB");
    const jobsCollection = db.collection("jobs");
    const companyCollection = db.collection("companies");
    const usersCollection = db.collection("user");
    const applicationsCollection = db.collection("applications");
    const planCollection = db.collection("plans");
    const subscriptionCollection = db.collection("subscription");

    app.get("/api/users", async (req, res) => {
      const cursor = usersCollection.find().skip(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/api/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createdAt: new Date(),
      };
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    // application related apis
    app.get("/api/applications", async (req, res) => {
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;
      }
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      const cursor = applicationsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/api/applications", async (req, res) => {
      const application = req.body;
      const newApplication = {
        ...application,
        createdAt: new Date(),
      };
      const result = await applicationsCollection.insertOne(newApplication);
      res.send(result);
    });

    // company related apis

    // app.get("/api/companies", async (req, res) => {
    //   const cursor = companyCollection.find().skip(3);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    app.get("/api/my/companies", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const result = await companyCollection.findOne(query);

      res.send(result || {});
    });
    app.get("/api/companies", async (req, res) => {
      const cursor = companyCollection.find();
      const companies = await cursor.toArray();

      for (const company of companies) {
        const filter = {
          companyId: company._id.toString(),
        };
        const jobCount = await jobsCollection.countDocuments(filter);
        company.jobCount = jobCount;
      }

      res.send(companies);
    });
    app.post("/api/companies", async (req, res) => {
      const company = req.body;
      const newCompany = {
        ...company,
        createdAt: new Date(),
      };
      const result = await companyCollection.insertOne(newCompany);
      res.send(result);
    });
    app.patch("/api/companies/:id", async (req, res) => {
      const id = req.params.id;
      const updatedCompany = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: updatedCompany.status,
        },
      };
      const result = await companyCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // plans
    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }
      const plan = await planCollection.findOne(query);
      res.send(plan);
    });
    app.post("/api/subscriptions", async (req, res) => {
      const data = req.body;
      const newData = {
        ...data,
        createdAt: new Date(),
      };
      const result = await subscriptionCollection.insertOne(newData);

      // Proactively update user's plan in user collection
      if (data.email && data.planId) {
        await usersCollection.updateOne(
          { email: data.email },
          { $set: { plan: data.planId } },
        );
      }

      res.send(result);
    });
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
