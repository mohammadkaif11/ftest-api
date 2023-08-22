const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 4000;
const { Octokit } = require("octokit");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

app.use(bodyParser.json());

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
        Header: ftest.HeaderContent,
        Content: ftest.HeaderDescription,
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

    res.json(newFtest);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
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
    if (data.status == 200 || (data.status == 201 && data != null)) {
      //Call the api after 5secs 
      setTimeout(async () => {
        const ChangeData = {
          Name: repoName,
        };
        const path = "data.json";
        const content = Buffer.from(JSON.stringify(ChangeData)).toString(
          "base64"
        );

        // If the file already exists, you need to provide the sha in order to update the file content.
        const file = await octokit.rest.repos.getContent({
          owner: ownerName,
          repo: repoName,
          path: path,
          branch: "main",
        });

        const { sha } = file.data;
        const fileContent = await octokit.rest.repos.createOrUpdateFileContents(
          {
            owner: ownerName,
            repo: repoName,
            path: path,
            sha: sha,
            message: "This is the commit message generated via GitHub API",
            content,
          }
        );

        const {
          commit: { html_url },
        } = fileContent.data;

        console.log(`Content updated, see changes at ${html_url}`);
      }, 5000);
    }
  } catch (error) {
    console.log("error: ", error);
  }
};

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
