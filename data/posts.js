import {posts} from '../config/mongoCollections.js';
import validationFuncs from '../validation.js';
import {ObjectId} from 'mongodb';

const createPost = async(
    name,
    address,
    cuisine,
    diet,
    qualRating,
    safetyRating,
    accessRating,
    incidentOccurred,
    incidentComment,
    reviews
) => {
    name = validationFuncs.postNameHelper(name);
    address = validationFuncs.postNameHelper(address);
    cuisine = validationFuncs.postNameHelper(cuisine);

    const _id = new ObjectId();

    const newPost = {
        name,
        address,
        cuisine,
        diet,
        qualRating: 0,
        safetyRating: 0,
        accessRating: 0,
        incidentOccurred: 0,
        incidentComment: [],
        reviews: [],
        qualRatings: [],
        safetyRatings: [],
        accessRatings: []
    }

    const postCollection = await posts();

    const checkName = await postCollection.findOne({ name });
    const checkAddress = await postCollection.findOne({ address });
    if(checkName && checkAddress) throw 'Restaurant is already posted.';

    const insertPost = await postCollection.insertOne(newPost);
    if (!insertPost.acknowledged || !insertPost.insertedId) {
        return { insertedPost: false };
    } 
    else {
        return { insertedPost: true };
    }
};

const getAllPosts = async() => {
    const postCollection = await posts();
    const allPosts = await postCollection.find({}).toArray();
    return allPosts;
};

const getPostById = async(id) => {

    if(!ObjectId.isValid(id)) throw 'Not a valid id.';
    if(!id) throw 'Provide an id.'


    const postCollection = await posts();
    const post = await postCollection.findOne({_id: new ObjectId(id)});
    if (!post) throw 'Error: Post not found by id provided.';

    post._id = post._id.toString();
    return post;
};

const deletePostById = async(id) => {
    if(!ObjectId.isValid(id)) throw 'Not a valid id.';
    if(!id) throw 'Provide an id.'

    const postCollection = await posts();
    const deletePost = await postCollection.findOneAndDelete({ _id: new ObjectId(id) });
    
    if (!deletePost) throw `Could not delete post with id of ${id}`;
    return {...deletePost, deleted: true};
};


const updatePost = async(id, name, address, cuisine, diet) => {
    if(!ObjectId.isValid(id)) throw 'Not a valid id.';
    if(!id) throw 'Provide an id.'
    
    name = validationFuncs.postNameHelper(name);
    address = validationFuncs.postAddressHelper(address);
    cuisine = validationFuncs.postNameHelper(cuisine);

    const postUpdateInfo = {
        name: name,
        address: address,
        cuisine: cuisine,
        diet: diet
    };

    const postCollection = await posts();

    const info = await postCollection.findOneAndReplace(
        {_id: new ObjectId(id)},
        postUpdateInfo,
        {returnDocument: 'after'}
    );

    if (!info) throw `Update failed. Could not find a post with id ${id}`;

    return info;
};

const postRating = async(postId, qualRating, safetyRating, accessRating) => {
    
    const postCollection = await posts();
    const ratePost = await getPostById(postId);

    const qualNum = Number(qualRating);
    const safetyNum = Number(safetyRating);
    const accessNum = Number(accessRating);

  if (isNaN(qualNum) || isNaN(safetyNum) || isNaN(accessNum)) {
    throw 'Invalid ratings data';
  }

    const updatedPost = await postCollection.updateOne(
        { _id: new ObjectId(postId) },
        {
          $push: {
            qualRatings: qualNum,
            safetyRatings: safetyNum,
            accessRatings: accessNum
          }
        }
    );

    if (updatedPost.modifiedCount === 0) throw 'Could not update ratings.';

    const postNewRatings = await postCollection.findOne({ _id: new ObjectId(postId) });

    const avgRate = validationFuncs.avgRatingCalc(postNewRatings.qualRatings);
    const avgSafety =  validationFuncs.avgRatingCalc(postNewRatings.safetyRatings);
    const avgAccess = validationFuncs.avgRatingCalc(postNewRatings.accessRatings);

    await postCollection.updateOne(
        { _id: new ObjectId(postId) },
        {
          $set: {
            qualRating: avgRate,
            safetyRating: avgSafety,
            accessRating: avgAccess
          }
        }
    );

    return {
        success: true,
        message: 'Ratings updated successfully',
        updatedRatings: {
          qualRating: avgRate,
          safetyRating: avgSafety,
          accessRating: avgAccess
        }
      };
}

const filterPosts = async(diet) => {
    const allPosts = await postFunctions.getAllPosts();

    if(diet === 'none' || !diet) {
        return allPosts;
    }

    const filteredPosts = allPosts.filter((post) => Array.isArray(post.diet) && post.diet.map(d => d.toLowerCase()).includes(diet.toLowerCase()));
    return filteredPosts
}

const postFunctions = {
    createPost,
    getAllPosts,
    getPostById,
    deletePostById,
    updatePost,
    postRating,
    filterPosts
};

export default postFunctions;