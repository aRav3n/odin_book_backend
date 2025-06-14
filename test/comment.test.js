/* to run only this test:
  clear & npx tsc & npx jest test/comment.test.js
*/

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  generateCommentAndParents,
  generateUserAndProfile,
  generateUserProfilePost,
  deleteUser,
} = require("./internalTestFunctions");

let commentStart;

beforeEach(() => {
  commentStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - commentStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

test("Create Comment On Post route fails if :postId is missing", async () => {
  await request(app)
    .post("/comment/post/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Comment On Post route fails if :profileId is missing", async () => {
  await request(app)
    .post("/comment/post/-1/from/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Comment On Post route fails if :postId is not a number", async () => {
  await request(app)
    .post("/comment/post/xyz/from/1")
    .type("form")
    .send({ whoIsBack: "Backstreet" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Not all of your req.params were valid." }] })
    .expect(400);
});

test("Create Comment On Post route fails if :profileId is not a number", async () => {
  await request(app)
    .post("/comment/post/1/from/xyz")
    .type("form")
    .send({ whoIsBack: "Backstreet" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Not all of your req.params were valid." }] })
    .expect(400);
});

test("Create Comment On Post route fails if req.body doesn't exist", async () => {
  await request(app)
    .post("/comment/post/1/from/1")
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message:
            "There was a problem with the form data submitted; fill it out again and re-submit.",
        },
      ],
    })
    .expect(400);
});

test("Create Comment On Post route fails if authHeader is missing", async () => {
  await request(app)
    .post("/comment/post/1/from/1")
    .expect("Content-Type", /json/)
    .type("form")
    .send({})
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Create Comment On Post route fails if token is corrupted", async () => {
  const token = "Not_a_validHeader";

  await request(app)
    .post("/comment/post/1/from/1")
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({})
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Create Comment On Post route fails if :postId is for a nonexistent post", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const nonexistentId = -1;

  await request(app)
    .post(`/comment/post/${nonexistentId}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "text", profileId: profile.id })
    .expect({
      errors: [
        { message: `A post with the id of ${nonexistentId} was not found.` },
      ],
    })
    .expect(404);

  await deleteUser(user);
});

test("Create Comment On Post route fails if :profileId is for a nonexistent profile", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const nonexistentId = -1;

  await request(app)
    .post(`/comment/post/${post.id}/from/${nonexistentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "text", profileId: profile.id })
    .expect({
      errors: [
        { message: `A profile with an id of ${nonexistentId} was not found.` },
      ],
    })
    .expect(404);

  await deleteUser(user);
});

test("Create Comment On Post route fails if req.body.text doesn't exist", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message:
            "There was a problem with the form data submitted; fill it out again and re-submit.",
        },
      ],
    })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment On Post route fails if req.body.text is empty", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "" })
    .expect({ errors: [{ message: "Text must be included" }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment On Post route fails if req.body.text is not a string", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: true })
    .expect({ errors: [{ message: "Text must be a string" }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment On Post route succeeds with correct requirements", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const text = "So true!";

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.text).toBe(text);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.postId).toBe(post.id);
      expect(res.body.commentId).toBeFalsy();
    });

  await request(app)
    .get(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body._count.comments).toBe(1);
    });

  await deleteUser(user);
});

test("Get Comments On Post route fails if :postId is missing", async () => {
  const postId = "";
  await request(app)
    .get(`/comment/post/${postId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Get Comments On Post route fails if :postId is not a number", async () => {
  const postId = "xyz";
  await request(app)
    .get(`/comment/post/${postId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);
});

test("Get Comments On Post route fails if authHeader is missing", async () => {
  const postId = -1;
  await request(app)
    .get(`/comment/post/${postId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Get Comments On Post route fails if authHeader is corrupted", async () => {
  const postId = -1;
  const token = "corruptedToken369";
  await request(app)
    .get(`/comment/post/${postId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Get Comments On Post route fails if :postId is for a nonexistent post", async () => {
  const { user, profile } = await generateUserAndProfile();
  const postId = -1;

  await request(app)
    .get(`/comment/post/${postId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "That post was not found in the database." }],
    })
    .expect(404);

  await deleteUser(user);
});

test("Get Comments On Post route succeeds with correct requirements", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const text = "I'm commenting on this post before anyone else does!";

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect(200);

  await request(app)
    .get(`/comment/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body[0].id).toBeGreaterThan(0);
      expect(res.body[0].text).toBe(text);
      expect(res.body[0].profileId).toBe(profile.id);
      expect(res.body[0].Profile.name).toBe(profile.name);
    });

  await deleteUser(user);
});

test("Create Comment Reply route fails if :commentId is missing", async () => {
  await request(app)
    .post("/comment/reply/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Comment Reply route fails if :profileId is missing", async () => {
  const commentId = -1;

  await request(app)
    .post(`/comment/reply/${commentId}/from/`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Comment Reply route fails if req.body doesn't exist", async () => {
  const commentId = "xyz";
  const profileId = -1;

  await request(app)
    .post(`/comment/reply/${commentId}/from/${profileId}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message:
            "There was a problem with the form data submitted; fill it out again and re-submit.",
        },
      ],
    })
    .expect(400);
});

test("Create Comment Reply route fails if :commentId is not a number", async () => {
  const commentId = "xyz";
  const profileId = -1;
  const text = "Never tell me the odds!";

  await request(app)
    .post(`/comment/reply/${commentId}/from/${profileId}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Not all of your req.params were valid." }] })
    .expect(400);
});

test("Create Comment Reply route fails if :profileId is not a number", async () => {
  const profileId = "xyz";
  const commentId = -1;
  const text = "Never tell me the odds!";

  await request(app)
    .post(`/comment/reply/${commentId}/from/${profileId}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Not all of your req.params were valid." }] })
    .expect(400);
});

test("Create Comment Reply route fails if authHeader is missing", async () => {
  const profileId = -1;
  const commentId = -1;
  const text = "Never tell me the odds!";

  await request(app)
    .post(`/comment/reply/${commentId}/from/${profileId}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Create Comment Reply route fails if authHeader is corrupted", async () => {
  const profileId = -1;
  const commentId = -1;
  const text = "Never tell me the odds!";

  await request(app)
    .post(`/comment/reply/${commentId}/from/${profileId}`)
    .set("Authorization", `Bearer ${text}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Create Comment Reply route fails if :profileId is for a nonexistent profile", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const nonexistentId = -1;
  const text = "Never tell me the odds!";

  await request(app)
    .post(`/comment/reply/${nonexistentId}/from/${nonexistentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: `A profile with an id of ${nonexistentId} was not found.` },
      ],
    })
    .expect(404);

  await deleteUser(user);
});

test("Create Comment Reply route fails if :commentId is for a nonexistent comment", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const nonexistentId = -1;
  const text = "Never tell me the odds!";

  await request(app)
    .post(`/comment/reply/${nonexistentId}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: `A comment with an id of ${nonexistentId} was not found.` },
      ],
    })
    .expect(404);

  await deleteUser(user);
});

test("Create Comment Reply route fails if req.body.text doesn't exist", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();
  const text = "Never tell me the odds!";

  await request(app)
    .post(`/comment/reply/${comment.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ notText: text })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Text must be included" }],
    })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment Reply route fails if req.body.text is empty", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();
  const text = " ";

  await request(app)
    .post(`/comment/reply/${comment.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Text must be included" }],
    })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment Reply route fails if req.body.text is not a string", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();

  await request(app)
    .post(`/comment/reply/${comment.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text: true })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Text must be a string" }],
    })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment Reply route succeeds with correct requirements", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();
  const text = "This route should pass.";

  await request(app)
    .post(`/comment/reply/${comment.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.text).toBe(text);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.commentId).toBe(comment.id);
    });

  await deleteUser(user);
});

test("Create Comment Reply route succeeds for a comment on a comment on a comment", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();
  const text = "This route should pass.";

  await request(app)
    .post(`/comment/reply/${comment.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect(200)
    .then(async (res) => {
      expect(res.body.text).toBe(text);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.commentId).toBe(comment.id);

      await request(app)
        .post(`/comment/reply/${res.body.id}/from/${profile.id}`)
        .set("Authorization", `Bearer ${user.token}`)
        .type("form")
        .send({ text: "Replying" })
        .expect("Content-Type", /json/)
        .expect(200)
        .then((resTwo) => {
          expect(resTwo.body.commentId).toBe(res.body.id);
        });
    });

  await deleteUser(user);
});

test("Get Comment Replies route fails if :commentId is missing", async () => {
  await request(app)
    .get("/comment/reply/")
    .expect(404)
    .expect({
      errors: [
        {
          message: "Route not found",
        },
      ],
    });
});

test("Get Comment Replies route fails if :commentId is not a number", async () => {
  const commentId = "xyz";
  await request(app)
    .get(`/comment/reply/${commentId}`)
    .expect(400)
    .expect({
      errors: [
        {
          message: "No valid req.params were found.",
        },
      ],
    });
});

test("Get Comment Replies route fails if authHeader is missing", async () => {
  const commentId = -1;
  await request(app)
    .get(`/comment/reply/${commentId}`)
    .expect(401)
    .expect({
      errors: [
        {
          message: "You must be logged in to do that.",
        },
      ],
    });
});

test("Get Comment Replies route fails if authHeader is corrupted", async () => {
  const commentId = -1;
  const token = "notAToken";

  await request(app)
    .get(`/comment/reply/${commentId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(401)
    .expect({
      errors: [
        {
          message: "Please sign in again and re-try that.",
        },
      ],
    });
});

test("Get Comment Replies route fails if parent comment doesn't exist", async () => {
  const { user, profile } = await generateUserAndProfile();
  const commentId = -1;

  await request(app)
    .get(`/comment/reply/${commentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect(404)
    .expect({
      errors: [
        {
          message: "That comment was not found in the database.",
        },
      ],
    });
});

test("Get Comment Replies route succeeds with correct requirements", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();

  await request(app)
    .get(`/comment/reply/${comment.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect(200)
    .expect([]);

  await deleteUser(user);
});

test("Get Comment Replies route succeeds for a comment that has replies", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();

  const text = "This is a comment reply.";
  const textAlso = "This is the reply you are looking for.";

  await request(app)
    .post(`/comment/reply/${comment.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect(200);

  await request(app)
    .post(`/comment/reply/${comment.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text: textAlso })
    .expect(200);

  await request(app)
    .get(`/comment/reply/${comment.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect(200)
    .then((res) => {
      const array = res.body;

      expect(array[0].id).toBeGreaterThan(0);
      expect(array[0].text).toBe(text);
      expect(array[0].profileId).toBe(profile.id);
      expect(array[0].Profile.name).toBe(profile.name);

      expect(array[1].id).toBeGreaterThan(0);
      expect(array[1].text).toBe(textAlso);
      expect(array[1].profileId).toBe(profile.id);
      expect(array[1].Profile.name).toBe(profile.name);
    });

  await deleteUser(user);
});

test("Update Comment route fails if :commentId is missing", async () => {
  await request(app)
    .put("/comment/")
    .expect(404)
    .expect({
      errors: [
        {
          message: "Route not found",
        },
      ],
    });
});

test("Update Comment route fails if req.body doesn't exist", async () => {
  const commentId = -1;

  await request(app)
    .put(`/comment/${commentId}`)
    .expect(400)
    .expect({
      errors: [
        {
          message:
            "There was a problem with the form data submitted; fill it out again and re-submit.",
        },
      ],
    });
});

test("Update Comment route fails if authHeader is missing", async () => {
  const commentId = -1;

  await request(app)
    .put(`/comment/${commentId}`)
    .type("form")
    .send({})
    .expect(401)
    .expect({
      errors: [
        {
          message: "You must be logged in to do that.",
        },
      ],
    });
});

test("Update Comment route fails if authHeader is corrupted", async () => {
  const commentId = -1;

  await request(app)
    .put(`/comment/${commentId}`)
    .set("Authorization", "Bearer badToken")
    .type("form")
    .send({})
    .expect(401)
    .expect({
      errors: [
        {
          message: "Please sign in again and re-try that.",
        },
      ],
    });
});

test("Update Comment route fails if :commentId is not a number", async () => {
  const commentId = "xyz";

  const { user, profile, post, comment } = await generateCommentAndParents();
  await request(app)
    .put(`/comment/${commentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({})
    .expect(400)
    .expect({
      errors: [
        {
          message: "No valid req.params were found.",
        },
      ],
    });

  await deleteUser(user);
});

test("Update Comment route fails if user in authHeader isn't :commentId owner", async () => {
  const commentId = -1;

  const { user, profile, post, comment } = await generateCommentAndParents();
  await request(app)
    .put(`/comment/${commentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({})
    .expect(403)
    .expect({
      errors: [
        {
          message: "Access to that post is not allowed from this account.",
        },
      ],
    });

  await deleteUser(user);
});

test("Update Comment route fails if :commentId is for a nonexistent comment", async () => {
  const commentId = -1;
  const text = "Sample text.";

  const { user, profile, post, comment } = await generateCommentAndParents();
  await request(app)
    .put(`/comment/${commentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect({
      errors: [
        {
          message: "Access to that post is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Update Comment route fails if req.body.text doesn't exist", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();

  await request(app)
    .put(`/comment/${comment.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({})
    .expect(400)
    .expect({ errors: [{ message: "Text must be included" }] });

  await deleteUser(user);
});

test("Update Comment route fails if req.body.text is empty", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();

  await request(app)
    .put(`/comment/${comment.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text: "" })
    .expect(400)
    .expect({ errors: [{ message: "Text must be included" }] });

  await deleteUser(user);
});

test("Update Comment route fails if req.body.text is not a string", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();

  await request(app)
    .put(`/comment/${comment.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text: true })
    .expect(400)
    .expect({ errors: [{ message: "Text must be a string" }] });

  await deleteUser(user);
});

test("Update Comment route succeeds with correct requirements", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();
  const text = "Comment update.";

  await request(app)
    .put(`/comment/${comment.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect(200)
    .expect({ ...comment, text });

  await deleteUser(user);
});

test("Delete Comment route fails if :commentId is missing", async () => {
  await request(app)
    .delete("/comment/")
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Delete Comment route fails if :commentId is not a number", async () => {
  const commentId = "xyz";

  await request(app)
    .delete(`/comment/${commentId}`)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);
});

test("Delete Comment route fails if authHeader is missing", async () => {
  const commentId = -1;

  await request(app)
    .delete(`/comment/${commentId}`)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Delete Comment route fails if authHeader is corrupted", async () => {
  const commentId = -1;
  const token = "notAToken";

  await request(app)
    .delete(`/comment/${commentId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Delete Comment route fails if user in authHeader isn't :commentId owner or comment doesn't exist", async () => {
  const { user, profile } = await generateUserAndProfile();
  const commentId = -1;

  await request(app)
    .delete(`/comment/${commentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect({
      errors: [
        { message: "Access to that post is not allowed from this account." },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Delete Comment route succeeds with correct requirements", async () => {
  const { user, profile, post, comment } = await generateCommentAndParents();

  await request(app)
    .get(`/comment/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect(200)
    .then((res) => {
      const resComment = res.body[0];
      expect(resComment.id).toBe(comment.id);
      expect(resComment.text).toBe(comment.text);
      expect(resComment.Profile.name).toBe(profile.name);
    });

  await request(app)
    .delete(`/comment/${comment.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect(comment)
    .expect(200);

  await request(app)
    .get(`/comment/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect([])
    .expect(200);

  await deleteUser(user);
});
