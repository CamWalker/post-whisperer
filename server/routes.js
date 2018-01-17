import express from 'express';
import axios from 'axios';
import brain from 'brain';
import _ from 'lodash';
import {
  calculateSummaryInfo,
  transformDataIO,
} from './utils/data-transformer';
import * as authenticate from './controllers/authenticate';

const router = express.Router();



router.post('/facebook', (req, res) => {
  let posts = [];
  const network = new brain.NeuralNetwork();
  const reverseNetwork = new brain.NeuralNetwork();
  const reverseNetworkReactions = new brain.NeuralNetwork();
  const reverseNetworkComments = new brain.NeuralNetwork();

  function getMoreData(nextUrl) {
    console.log('getMoreData', nextUrl);
    axios.get(nextUrl).then((response) => {
      const data = _.get(response, 'data');
      posts = _.concat(posts, data.data);
      const lastDateYear = _.toNumber(_.split(_.get(_.last(posts), 'created_time'), '-')[0]);
      if (data.paging && _.size(posts) < 500 && lastDateYear > 2012) {
        getMoreData(_.get(data.paging, 'next'));
      } else {
        console.log(posts.length);
        transformData();
      }
    })
  }

  function transformData() {
    console.log('transformData');
    posts = _.filter(posts, (row) => {
      const dateYear = _.toNumber(_.split(_.get(row, 'created_time'), '-')[0]);
      return _.has(row, 'likes') && dateYear >= 2012
    })
    const summaryInfo = calculateSummaryInfo(posts);
    const transformedIOData = _.map(posts, (row, index) => {
      return transformDataIO(
        row,
        summaryInfo,
        _.get(_.get(posts, (index + 1), {}), 'created_time', null),
        _.get(_.get(posts, (index - 1), {}), 'created_time', null),
        false
      );
    });

    network.train(transformedIOData, {
      errorThresh: 0.007,
      iterations: 5000,
      log: true,
      logPeriod: 100,
      learningRate: 0.3
    });

    const reverseTransformedIOData = _.map(posts, (row, index) => {
      return transformDataIO(
        row,
        summaryInfo,
        _.get(_.get(posts, (index + 1), {}), 'created_time', null),
        _.get(_.get(posts, (index - 1), {}), 'created_time', null),
        true
      )
    });

    const reverseReactionsOnly = _.map(reverseTransformedIOData, (post) => {
      const postCopy = _.cloneDeep(post);
      delete postCopy.output.shareCount;
      delete postCopy.output.commentCount;
      return postCopy;
    });
    const reverseCommentsOnly = _.map(reverseTransformedIOData, (post) => {
      const postCopy = _.cloneDeep(post);
      delete postCopy.output.shareCount;
      delete postCopy.output.reactionCount;
      return postCopy;
    });

    reverseNetwork.train(reverseTransformedIOData, {
      errorThresh: 0.005,  // error threshold to reach
      iterations: 5000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 100,       // number of iterations between logging
      learningRate: 0.3    // learning rate
    });
    reverseNetworkReactions.train(reverseReactionsOnly, {
      errorThresh: 0.005,  // error threshold to reach
      iterations: 5000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 100,       // number of iterations between logging
      learningRate: 0.3    // learning rate
    });
    reverseNetworkComments.train(reverseCommentsOnly, {
      errorThresh: 0.005,  // error threshold to reach
      iterations: 5000,   // maximum training iterations
      log: true,           // console.log() progress periodically
      logPeriod: 100,       // number of iterations between logging
      learningRate: 0.3    // learning rate
    });

    const networkJSON = network.toJSON();
    const reverseNetworkJSON = reverseNetwork.toJSON();
    const reverseNetworkReactionsJSON = reverseNetworkReactions.toJSON();
    const reverseNetworkCommentsJSON = reverseNetworkComments.toJSON();

    const result = network.run({
      reactionCount: 1,
      commentCount: 1,
      shareCount: 1,
    });

    const reactionResult = network.run({
      reactionCount: 1,
    });

    const commentResult = network.run({
      commentCount: 1,
    });

    const shareResult = network.run({
      shareCount: 1,
    });

    const noResult = network.run({
      reactionCount: 0,
      commentCount: 0,
      shareCount: 0,
    });

    console.log(
      'result: ', result,
      'reactionResult: ', reactionResult,
      'commentResult: ', commentResult,
      'shareResult: ', shareResult,
      'noResult: ', noResult
    );

    res.status(200).send({ networkJSON, reverseNetworkJSON, reverseNetworkReactionsJSON, reverseNetworkCommentsJSON, summaryInfo, recentPostTime: _.get(_.get(posts, 0, {}), 'created_time', null) })
  }
  console.log('pre-call');
  const { id } = req.body.profile;
  const { accessToken } = req.body;
  axios.get(`https://graph.facebook.com/v2.11/${id}?`, {
    params: {
      fields: 'posts.limit(500){reactions.summary(true){type},comments.limit(0).summary(true),shares,privacy,likes.limit(0).summary(true),type,created_time,message}',
      access_token: accessToken,
    }
  })
  .then(response => {

    const responsePosts = response.data.posts;
    posts = _.concat(posts, responsePosts.data);
    console.log(responsePosts.paging);
    if (_.get(responsePosts.paging, 'next', null)) {
      getMoreData(_.get(responsePosts.paging, 'next'));
    } else {
      console.log(posts.length);
      transformData();
    }
  })
  .catch(err => console.log(err));
});




export default router;
