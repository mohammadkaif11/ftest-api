require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 4000;
const { Octokit } = require("octokit");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const prisma = new PrismaClient();
app.use(cors());
app.use(bodyParser.json());

//ftest/:name git input
app.post("/ftest-input", async (req, res, next) => {
  try {
    let ftest = {
      Name: req.body["Name (1 - 25 char.)"],
      HeaderContent: req.body["Header Content(30-45 char.)"],
      HeaderDescription: req.body["Header Description (100 - 135 char.)"],
    };

    let labels = [
      {
        Label: req.body["Label 1 (1 - 25 char.)"],
      },
      {
        Label: req.body["Label 2 (1 - 25 char.)"],
      },
      {
        Label: req.body["Label 3 (1 - 25 char.)"],
      },
      {
        Label: req.body["Label 4 (1 - 25 char.)"],
      },
    ];

    let stats = [
      {
        Name: req.body["Stats-1 Name (10 - 35 char.)"],
        Value: req.body["Value 1"],
      },
      {
        Name: req.body["Stats-2 Name (10 - 35 char.)"],
        Value: req.body["Value 2"],
      },
      {
        Name: req.body["Stats-3 Name (10 - 35 char.)"],
        Value: req.body["Value 3"],
      },
    ];

    let feature = {
      Header: req.body["Feature Header (30 - 45 char.)"],
      Description: req.body["Feature Description (120 - 180 char.)"],
      Tag: req.body["Feature Tag (10 - 15 char.)"],
    };

    let featureNameandDescription = [
      {
        Name: req.body["Feature 1 (10 - 20 char.)"],
        Description: req.body["Feature-1 Description ( 80 - 130 char.)"],
      },
      {
        Name: req.body["Feature 2 (10 - 20 char.)"],
        Description: req.body["Feature-2 Description ( 80 - 130 char.)"],
      },
      {
        Name: req.body["Feature 3 (10 -  20 char.)"],
        Description: req.body["Feature-3 Description ( 80 -  130 char.)"],
      },
      {
        Name: req.body["Feature 4 (10 - 20 char.)"],
        Description: req.body["Feature-4 Description ( 80 -  130 char.)"],
      },
    ];

    let callToAction = {
      Header: req.body["Call To Action Header( 30 - 70 char.)"],
      Description: req.body["Call To Action Description (130 - 180 char.)"],
    };

    const existingFtest = await prisma.ftest.findMany({
      where: {
        Name: ftest.Name,
      },
    });

    if (existingFtest.length > 0) {
      return res.status(400).json({ error: "Ftest name already exists" });
    }

    const newFtest = await prisma.ftest.create({
      data: {
        Name: ftest.Name,
        HeaderContent: ftest.HeaderContent,
        HeaderDescription: ftest.HeaderDescription,
        labels: { createMany: { data: labels } },
        stats: { createMany: { data: stats } },
        feature: {
          create: {
            Tag: feature.Tag,
            Description: feature.Description,
            Header: feature.Header,
            featureNameAndDescriptions: {
              createMany: { data: featureNameandDescription },
            },
          },
        },
        cta: { create: callToAction },
      },
      include: {
        labels: true,
        stats: true,
        feature: {
          include: {
            featureNameAndDescriptions: true,
          },
        },
        cta: true,
      },
    });

    const RepoName = newFtest.Name;

    //Cloning Github Repository
    if (newFtest) {
      const data = await GitHubCreateRepo(RepoName);
      //Deploy service and commit changes
      if (data.status == 200 || data.status == 201) {
        setTimeout(async () => {
          const data = await DeployService(RepoName);
          if (data.status == 200) {
            await PushCommitted(RepoName);
          } else {
            console.log("failed to deploy service");
            res.json({ data: null, msg: "failed to deploy service" });
          }
        }, 5000);
      } else {
        console.log("Error while creating github repo ");
        res.json({ data: null, msg: "failed creating github repo" });
      }
    }else{
      res.json({ data: newFtest, msg: "failed created" });
    }
    res.json({ data: newFtest, msg: "successfully created" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Get Ftest by Name
app.get("/ftests/:name", async (req, res) => {
  try {
    const ftestName = req.params.name;

    const foundFtest = await prisma.ftest.findMany({
      where: {
        Name: ftestName,
      },
      include: {
        labels: true,
        stats: true,
        feature: {
          include: {
            featureNameAndDescriptions: true,
          },
        },
        cta: true,
      },
    });

    if (!foundFtest) {
      return res.status(404).json({ message: "Ftest not found" });
    }

    res.json(foundFtest);
  } catch (error) {
    console.error("Error fetching Ftest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const GitHubCreateRepo = async (RepoName) => {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const ownerName = process.env.GITHUB_OWNER;
    const templateName = process.env.GITHUB_TEMPLATE_NAME;
    const repoName = RepoName;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const data = await octokit.request(
      `POST /repos/${ownerName}/${templateName}/generate`,
      {
        owner: ownerName,
        name: repoName,
        description: `This is your ${repoName} repository`,
        include_all_branches: false,
        private: false,
        headers: {
          authorization: `token ${GITHUB_TOKEN}`,
          "content-type": "application/json; charset=utf-8",
        },
      }
    );

    console.log(
      "successfullly created repo with name: " + JSON.stringify(RepoName)
    );
    return data;
  } catch (error) {
    console.log("Failed created repo with name: " + JSON.stringify(RepoName));
    console.log("error: ", error);
  }
};

const DeployService = async (RepoName) => {
  const TeamId = process.env.VERCEL_TEAM;
  const Token = process.env.VERCEL_TOKEN;

  const BodyData = {
    name: RepoName.toLowerCase(),
    buildCommand: "npm run build",
    framework: "nextjs",
    gitRepository: {
      repo: RepoName,
      type: "github",
    },
    installCommand: "npm install",
    publicSource: true,
  };

  try {
    const data = await fetch(
      `https://api.vercel.com/v9/projects?teamId=${TeamId}`,
      {
        body: JSON.stringify(BodyData),
        headers: {
          Authorization: `Bearer ${Token}`,
          "Content-Type": "application/json",
        },
        method: "post",
      }
    );
    console.log("application successfully deployed ", data);
    return data;
  } catch (error) {
    console.log("application failed to deployed ", error);
  }
};

const PushCommitted = async (RepoName) => {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const ownerName = process.env.GITHUB_OWNER;
    const repoName = RepoName;
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const ChangeData = {
      Name: repoName,
    };
    const path = "data.json";
    const content = Buffer.from(JSON.stringify(ChangeData)).toString("base64");

    // If the file already exists, you need to provide the sha in order to update the file content.
    const file = await octokit.rest.repos.getContent({
      owner: ownerName,
      repo: repoName,
      path: path,
      branch: "main",
    });

    const { sha } = file.data;
    const fileContent = await octokit.rest.repos.createOrUpdateFileContents({
      owner: ownerName,
      repo: repoName,
      path: path,
      sha: sha,
      message: "This is the commit message generated via GitHub API",
      content,
    });

    const {
      commit: { html_url },
    } = fileContent.data;

    console.log(`Content updated, see changes at ${html_url}`);
    console.log("sucessfully committed");
  } catch (error) {
    console.log("Error while committing ", error);
  }
};

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
