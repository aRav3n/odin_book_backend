const { validationResult } = require("express-validator");

const {
  createPostForProfile,
  readPostFromDatabase,
  updatePostText,
  deletePostFromDatabase,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validatePost,
} = require("./internalFunctions");

const createPost = [
  validatePost,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const post = await createPostForProfile(req.profileId, req.body.text);

    if (!post) {
      return res
        .status(500)
        .json(
          generateIndividualErrorMessage(
            "Something went wrong when trying to create that post. Please try again."
          )
        );
    }

    return res.status(200).json(post);
  },
];

async function deletePost(req, res) {
  const post = await deletePostFromDatabase(req.postId);
  
  return res.status(200).json(post);
}

async function readPost(req, res) {
  const post = await readPostFromDatabase(req.postId);
  if (!post) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          `No post with an id of ${req.postId} found.`
        )
      );
  }

  return res.status(200).json(post);
}

async function updatePost(req, res) {
  const text = req.body.text || null;
  if (!text || text.length === 0) {
    return res
      .status(400)
      .json(generateIndividualErrorMessage("Post text must be included"));
  }

  const updatedPost = await updatePostText(req.postId, text);
  return res.status(200).json(updatedPost);
}

module.exports = { createPost, readPost, updatePost, deletePost };
