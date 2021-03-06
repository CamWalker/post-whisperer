import _ from 'lodash';
import wordAnalyzer from 'word-frequency-analyzer';
import SentenceTypeClassifier from 'sentence-type-classifier';
import sentenceTokenizer from './natural/tokenizers/sentence_tokenizer';
import PorterStemmer from './natural/stemmers/porter_stemmer';
PorterStemmer.attach();
const sentenceTokenize = new sentenceTokenizer();
const sentenceClassifier = new SentenceTypeClassifier();


const transformDataIO = (inputData, summaryInfo, lastPostTime, reversed = false) => {
  const output = reversed ? 'input' : 'output';
  const input = reversed ? 'output' : 'input';

  const finalData = {};
  finalData[output] = {
    // STATUS type
    status: 0,
    link: 0,
    photo: 0,
    video: 0,
    offer: 0,
    //reaction Type
    love: 0,
    wow: 0,
    haha: 0,
    sad: 0,
    angry: 0,
    // DATE
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    // TIME
    minutesOfDay: 0,
    timeFromLastPost: 0,
    // TEXT
    postLength: 0,
    ...summaryInfo.keyWordsMap,
    // // sentence type
    assertive: 0,
    negative: 0,
    interrogative: 0,
    imperative: 0,
    exclamatory: 0,
    // PRIVACY
    allFriends: 0,
    friendsOfFriends: 0,
    everyone: 0,
    custom: 0,
    self: 0,
  };
  finalData[input] = {
    reactionCount: 0,
    commentCount: 0,
    shareCount: 0,
  }

  // PRIVACY
  finalData[output][_.camelCase(_.get(inputData, 'privacy.value'))] = 1;

  // transform Date/Time
  const date = new Date(_.get(inputData, 'created_time'));

  // // DAY OF WEEK
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  finalData[output][days[date.getDay()]] = 1;

  // // MINUTES OF DAY
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  finalData[output].minutesOfDay = (date.getTime() - midnight.getTime()) / 60000 / 1440;

  // // TIME FROM LAST POST
  let lastPostCreateTime;
  if (lastPostTime) {
    lastPostCreateTime = new Date(lastPostTime);
  } else {
    lastPostCreateTime = new Date(date.getTime());
  }
  finalData[output].timeFromLastPost = (date - lastPostCreateTime) / summaryInfo.maxTimeFromLastPost;

  // transform Type
  finalData[output][inputData.type] = 1;

  // transform Text
  const message = _.get(inputData, 'message', '');
  _.forEach(_.filter(_.uniq(message.tokenizeAndStem()), (value) => {
    return _.includes(summaryInfo.keyWords, value)
  }), (value) => {
    finalData[output][`kw-${value}`] = 1;
  });


  const sentences = sentenceTokenize.tokenize(message);
  _.forEach(sentences, (sentence) => {
    if (sentence) {
      const type = sentenceClassifier.classify(sentence);
      finalData[output][type] = 1;
    }
  })

  finalData[output].postLength = _.size(message) / summaryInfo.maxPostLength;

  // transform Reactions
  if (!_.has(inputData, 'reactions')) {
    finalData[input].reactionCount = _.toNumber(_.get(inputData.likes.summary, 'total_count', 0)) / summaryInfo.maxReaction;
  } else {
    finalData[input].reactionCount = _.toNumber(_.get(inputData.reactions.summary, 'total_count', 0)) / summaryInfo.maxReaction;
  }

  // REACTION TYPE
  if (_.find(_.get(inputData, 'reactions.data'), { type: 'LOVE' })) {
    finalData[output].love = 1;
  }
  if (_.find(_.get(inputData, 'reactions.data'), { type: 'WOW' })) {
    finalData[output].wow = 1;
  }
  if (_.find(_.get(inputData, 'reactions.data'), { type: 'HAHA' })) {
    finalData[output].haha = 1;
  }
  if (_.find(_.get(inputData, 'reactions.data'), { type: 'SAD' })) {
    finalData[output].sad = 1;
  }
  if (_.find(_.get(inputData, 'reactions.data'), { type: 'ANGRY' })) {
    finalData[output].angry = 1;
  }

  // transform Comments
  finalData[input].commentCount = _.toNumber(_.get(inputData.comments.summary, 'total_count', 0)) / summaryInfo.maxComment;

  finalData[input].shareCount = _.toNumber(_.get(inputData.shares, 'count', 0)) / summaryInfo.maxShares;

  return finalData;
}

export {
  transformDataIO,
};
