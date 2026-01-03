# Odin Book API

## Table of Contents

- [Description](#description)
- [Installation Instructions](#installation-instructions)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Dependencies and Credits](#dependencies-and-credits)
- [Project Structure](#project-structure)

## Description

This is the backend for my social media website project that I built for [The Odin Project](https://www.theodinproject.com). It is a RESTful API that uses JSON web tokens for authentication and authorization; it can be used per the endpoint instructions below. Please note that to use it yourself you'll need to clone this repo and update the allowList in app.js.

## Installation Instructions

1. Clone or fork this repo
2. cd into the project root directory (where the README.md file is located)
3. Run the following in your terminal (I've found that separating them into smaller install blocks helps when your internet is slower)

    - ```bash
      npm init -y
      npm install
      ```

4. Create a .env file
    - ```bash
      NODE_ENV=development
      TEST_DATABASE_URL="your_local_test_database_url"
      DATABASE_URL="your_local_database_url"
      SECRET_KEY="your_secret_key"
      ```
5.  ```bash
    npm run dev
    ```
6. After making updates to ./src/queries.ts you'll want to run this to recompile queries.js
    - ```bash
      npx tsc
      ```
1.  Be sure to test the API regularly
    - ```bash
      npm run test
      ```

## Usage

- [Frontend repo](https://github.com/aRav3n/odin_book_frontend)

### API Usage

- **API Base URL**
  - https://odin-book-backend.onrender.com
- **Auth Header Note**
  - Most routes require a JSON Web Token
    - Correct format:
      - Authorization: Bearer token &lt;token&gt;
    - In this documentation, "authHeader" refers to this header
- **Routes & Successful Responses**
  - **Database Wakeup Route**
    - /
      - GET
        - Description: Wakes up the database by requesting a count of users
        - Requires: nothing
        - Success: 200 OK
          - Response: { message: "Database is awake and ready for coffee!" }
  - **User Routes**
    - /user
      - POST
        - Description: Create user account, this is the signup route
        - Requires: { email, password, confirmPassword }
        - Success: 200 OK
          - Response: { id, email }
    - /user/login
      - POST
        - Description: Create user login info, this is the login route
        - Requires: { email, password }
        - Success: 200 OK
          - Response: { id, email, token }
    - /user/:userId
      - GET
        - Description: Read user's email address
        - Requires: authHeader (must be userId owner)
        - Success: 200 OK
          - Response: { email }
      - PUT
        - Description: Update user account
        - Requires: authHeader (must be userId owner), { currentPassword, newEmail, newPassword, newPasswordConfirm }
        - Success: 200 OK
          - Response: { id, email, token}
      - DELETE
        - Description: Delete user account
        - Requires: authHeader (must be userId owner), { password }
        - Success: 200 OK
          - Response: { message: "Account successfully deleted." }
  - **Profile Routes**
    - /profile
      - POST
        - Description: Create a profile for a user
        - Requires: authHeader (just to verify logged in), { name, about (can be blank), website (can be blank), avatarUrl (can be blank) }
        - Success: 200 OK
          - Response: { id, userId, name, website, about, avatarUrl }
      - GET
        - Description: Read user's profile using the provided authHeader
        - Requires: authHeader (used for authentication and to identify the user)
        - Success: 200 OK
          - Response: { id, userId, name, about, website, avatarUrl, posts: [ ... ] }
    - /profile/anon
      - GET
        - Description: Creates and returns an anonymous profile and user object so users can browse the site without signing in
        - Requires: N/A
        - Success: 200 OK
          - Response: { user: { id, email, token }, profile: { id, name, about, website, avatarUrl, userId } }
    - /profile/list
      - POST
        - Description: Read list of profiles in alphabetical order by name, if the optional stringToMatch is included then only profiles whose names match this partial will be returned
        - Requires: authHeader (just to verify logged in), { stringToMatch } (optional)
        - Success: 200 OK
          - Response: [ { id, userId, name, about, website, avatarUrl } ]
    - /profile/:profileId
      - GET
        - Description: Read a profile, similar to visiting a profile page on Facebook
        - Requires: authHeader (just to verify logged in)
        - Success: 200 OK
          - Response: { id, userId, name, about, website, avatarUrl, posts: [ ... ] }
      - PUT
        - Description: Update a profile, can change name, about, and/or website
        - Requires: authHeader (must be profileId owner), { id (profileId), name, website (can be blank), avatarUrl (can be blank), about (can be blank) }
        - Success: 200 OK
          - Response: { id, userId, name, about, website, posts, avatarUrl }
      - DELETE
        - Description: Delete a profile
        - Requires: authHeader (must be profileId owner)
        - Success: 200 OK
          - Response: { id, name, about, website, userId }
  - **Post Routes**
    - /post/:profileId
      - POST
        - Description: Create a post from a profile, must be the user's own profile
        - Requires: authHeader (must be profileId owner), { text }
        - Success: 200 OK
          - Response: { id, createdAt, text, profileId, Profile: { name, id } }
    - /post/single/:postId
      - GET
        - Description: Read a specific post to see more detailed information
        - Requires: authHeader (just to verify logged in)
        - Success: 200 OK
          - Response: { id, createdAt, text, profileId, Profile: { name, id }, \_count: { comments, likes }, likes: [ { id } ] }
    - /post/recent/:start
      - GET
        - Description: Read the 10 most recent posts from all profiles, starting at the specified number
        - Requires: authHeader (just to verify logged in)
        - Success: 200 OK
          - Response: [ { id, createdAt, text, profileId, Profile: { name, id }, \_count: { comments, likes }, likes: [ { id } ] } ]
        - Sample
          - Send a GET request to /post/recent/11 with a valid authHeader
          - Response: [ { 11th most recent post }, ..., { 20th most recent post } ]
        - Notes:
          - Lowest start number available is 1
            - /post/recent/1 will return the 10 most recent posts
      - PUT
        - Description: Update a post
        - Requires: authHeader (must be postId owner), { text }
        - Success: 200 OK
          - Response: { id, createdAt, text, profileId, Profile: { name, id } }
      - DELETE
        - Description: Delete a post
        - Requires: authHeader (must be postId owner)
        - Success: 200 OK
          - Response: { id, createdAt, text, profileId, Profile: { name, id } }
  - **Comment Routes**
    - /comment/post/:postId/from/:profileId
      - POST
        - Description: Create a comment on a post
        - Requires: authHeader (just to verify logged in), { text }
        - Success: 200 OK
          - Response: { id, text, profileId, postId, commentId: null, Profile: { name, id }, \_count: { likes, replies } }
    - /comment/post/:postId
      - GET
        - Description: Read comments on a post
        - Requires: authHeader (just to verify logged in)
        - Success: 200 OK
          - Response: \[ { id, text, profileId, postId, commentId: null, Profile: { name, id }, \_count: { likes, replies }, likes: [ { id } ] } \]
    - /comment/reply/:commentId/from/:profileId
      - POST
        - Description: Create a reply to another comment
        - Requires: authHeader (just to verify logged in), { profileId, text }
        - Success: 200 OK
          - Response: { id, text, profileId, postId: null, commentId, Profile: { name, id }, \_count: { likes, replies } }
    - /comment/reply/:commentId
      - GET
        - Description: Read comment replies
        - Requires: authHeader (just to verify logged in)
        - Success: 200 OK
          - Response: \[ { id, text, profileId, postId: null, commentId, Profile: { name, id }, \_count: { likes, replies }, likes: [ { id } ] } \]
    - /comment/:commentId
      - PUT
        - Description: Update a comment
        - Requires: authHeader (must be commentId owner), { text }
        - Success: 200 OK
          - Response: { id, text, profileId, postId, commentId, Profile: { name, id }, \_count: { likes, replies } }
      - DELETE
        - Description: Delete a comment, currently can only be done by the comment owner
        - Requires: authHeader (must be commentId owner)
        - Success: 200 OK
          - Response: { id, text, profileId, postId, commentId }
  - **Follow Routes**
    - /follow/:followingId/from/:followerId
      - POST
        - Description: Create a new follow, followerId user is following followingId user
        - Requires: authHeader (must be followerId owner)
        - Success: 200 OK
          - Response: { id, updatedAt, accepted, followerId, followingId }
    - /follow/profile/followers/:profileId
      - GET
        - Description: Read list of profiles that are following profileId
        - Requires: authHeader (just to verify logged in)
        - Success: 200 OK
          - Response: \[ { follower: { id, name } } \]
    - /follow/profile/following/:profileId
      - GET
        - Description: Read list of profiles that profileId is following
        - Requires: authHeader (just to verify logged in)
        - Success: 200 OK
          - Response: \[ { following: { id, name } } \]
    - /follow/:followId
      - PUT
        - Description: Update a follow
          - Note: This is currently not in use but here in case we want to allow privacy settings of accepting followers before allowing a follow.
        - Requires: authHeader (must be follow's followingId owner), { accepted: true }
        - Success: 200 OK
          - Response: { success: true }
    - /follow/:deleteFollowId
      - DELETE
        - Description: Delete a follow
        - Requires: authHeader (must be owner of either followingId or followerId)
        - Success: 200 OK
          - Response: { success: true }
  - **Like Routes**
    - /like/comment/:likeCommentId/from/:profileId
      - POST
        - Description: Create a like on a comment
        - Requires: authHeader (must be profileId owner)
        - Success: 200 OK
          - Response: { id, profileId, commentId, postId: null }
    - /like/post/:likePostId/from/:profileId
      - POST
        - Description: Create a like on a post
        - Requires: authHeader (must be profileId owner)
        - Success: 200 OK
          - Response: { id, profileId, postId, commentId: null }
    - /like/:likeId
      - DELETE
        - Description: Delete a like
        - Requires: authHeader (must be likeId owner)
        - Success: 200 OK
          - Response: { id, profileId, postId, commentId }
- **Errors**
  - Response: { errors: \[ { message }, \] }
    - Example: { message: "The param likeCommentId must be a number." }
  - HTTP Codes
    - 400: Bad Request, a provided piece of information was incorrect
    - 401: Unauthorized, the auth header is missing or corrupted
    - 403: Forbidden, not able to perform the selected action from this account
    - 404: Not Found, route or database resource not found
    - 409: Conflict, cannot create a duplicate item in the database
    - 500: Internal Server Error, there was an error with the server, try again

### Features

- Returns JSON objects and 200 for good requests and accurate status codes with messages for bad requests
- Incorporates CORS
- Is a RESTful API
- Was built using test driven development (TDD) using Jest and supertest

## Technologies Used

### Backend

- <a href="https://nodejs.org"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" style="height: 2rem; width: auto;"> Node.js</a>
- <a href="https://expressjs.com/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" style="height: 2rem; width: auto;"> Express</a>
- <a href="https://www.postgresql.org/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" style="height: 2rem; width: auto;"/> PostgreSQL</a>
- <a href="https://www.prisma.io/"><img src="https://skillicons.dev/icons?i=prisma" style="height: 2rem; width: auto;"/> Prisma ORM</a>
- <a href="https://www.typescriptlang.org/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" style="height: 2rem; width: auto;"/> TypeScript</a>
- <a href="https://jestjs.io/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg" style="height: 2rem; width: auto;"/> Jest</a>

### Development Tools

- <a href="https://code.visualstudio.com/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg" style="height: 24px; width: auto;"/> VS Code</a>
- <a href="https://www.npmjs.com/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/npm/npm-original.svg" style="height: 24px; width: auto;"/> NPM</a>
- <a href="https://git-scm.com/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" style="height: 24px; width: auto;"/> Git</a>

### Hosting

- <a href="https://github.com/"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg" style="height: 24px; width: auto;"/> Github</a>
- <a href="https://neon.com/"><img src="https://neon.com/brand/neon-logomark-light-color.svg" style="height: 24px; width: auto;"/> Neon</a>
- <a href="https://render.com/"><img src="https://render.com/icon.svg" style="height: 24px; width: auto;"/> Render</a>

## Dependencies and Credits

### Package Dependencies

- [@prisma/extension-accelerate](https://www.npmjs.com/package/@prisma/extension-accelerate)
- [@prisma/client](https://www.npmjs.com/package/@prisma/client)
- [@types/node](https://www.npmjs.com/package/@types/node)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [cors](https://www.npmjs.com/package/cors)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [express-validator](https://www.npmjs.com/package/express-validator)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [pg](https://www.npmjs.com/package/pg)
- [supertest](https://www.npmjs.com/package/supertest)
- [tsx](https://www.npmjs.com/package/tsx)
- [uuid](https://www.npmjs.com/package/uuid)

### Other Credits

- [Devicion](https://devicon.dev/)
- [Skillicons](https://skillicons.dev/)

## Project Structure

```bash
├──controllers/
   ├──commentController.js
   ├──followController.js
   ├──internalFunctions.js
   ├──likeController.js
   ├──postController.js
   ├──profileController.js
   ├──securityController.js
   ├──userController.js
   └──wakeupController.js
├──db/
   └──queries.js             # Automatically placed here after running `npx tsc`
├──generated/
   ├──prisma/                # Prisma generated models
├──prisma/
   ├──migrations/
   └──schema.prisma
├──routes/
   └──router.js
├──src/
   └──queries.ts             # Database queries
├──test/
   ├──comment.test.js
   ├──follow.test.js
   ├──internalTestFunctions.js
   ├──like.test.js
   ├──post.test.js
   ├──profile.test.js
   └──user.test.js
├──.gitignore
├──LICENSE
├──README.md
├──app.js
├──notes.txt
├──package-lock.json
├──package.json
└──tsconfig.json
```
