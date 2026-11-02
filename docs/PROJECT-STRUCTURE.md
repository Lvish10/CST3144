# Project structure

```text
CST3144-Workspace/               (no Git repository here)
  frontend/                      origin: Lvish10/CST3144
    .git/  .vscode/launch.json
    index.html  app.js  style.css  README.md  docs/
  backend/                       origin: Lvish10/CST3144-Backend
    .git/  .vscode/launch.json
    server.js  seed.js  export.js
    package.json  package-lock.json
    .env                         PRIVATE, ignored by Git
    .env.example  .gitignore
    public/images/  postman/  docs/
  supporting-files/              shared local material, outside both repos
    database/                    actual Atlas Extended JSON snapshots
    coursework/                  original brief, when supplied
    guides/                      guides, audit reports and test evidence
    postman/                     preserved starter collection
    tools/                       optional verification/documentation tools
    README.md
  CST3144-AfterClass.code-workspace
```

Frontend: https://github.com/Lvish10/CST3144 → https://lvish10.github.io/CST3144/

Backend: https://github.com/Lvish10/CST3144-Backend → https://m01016510-after-school.onrender.com

Database: existing MongoDB Atlas after_school. Postman lives in backend/postman. Shared guides and private exports live outside both repositories. The original starter is preserved in the parent Cw folder.
