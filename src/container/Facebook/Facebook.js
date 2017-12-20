import React, { Component } from 'react';
import brain from 'brain';
import FacebookLogin from 'react-facebook-login';
import _ from 'lodash';
import axios from 'axios';
import {
  Step,
  Stepper,
  StepLabel,
  StepContent,
} from 'material-ui/Stepper';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import DatePicker from 'material-ui/DatePicker';
import TimePicker from 'material-ui/TimePicker';
import Checkbox from 'material-ui/Checkbox';
import CircularProgress from 'material-ui/CircularProgress';
import Slider from 'material-ui/Slider';
import Graph from './Graph';
import {
  calculateSummaryInfo,
  transformDataIO,
} from '../../utils/data-transformer';
import './Facebook.css';

class Facebook extends Component {
  constructor(props) {
    super(props);
    this.network = new brain.NeuralNetwork();
    this.reverseNetwork = new brain.NeuralNetwork();
    this.posts = [];
    this.state = {
      stepIndex: 0,
      changed: false,
      message: '',
      date: new Date(),
      privacy: 'allFriends',
      complete: false,
      reactionCount: 1,
      commentCount: 1,
      shareCount: 1,
      result: null,
    };
  }

  handleNext = () => {
    const {stepIndex} = this.state;
    this.setState({
      stepIndex: stepIndex + 1,
    });
  };

  responseFacebook = (response) => {
    this.handleNext();
    this.posts = _.concat(this.posts, response.posts.data);
    if (response.posts.paging) {
      this.getMoreData(_.get(response.posts.paging, 'next'));
    } else {
      this.handleNext();
      this.transformData();
    }
  }

  getMoreData = (nextUrl) => {
    console.log('getting more from facebook');
    axios.get(nextUrl).then((response) => {
      const data = _.get(response, 'data');
      this.posts = _.concat(this.posts, data.data);
      const lastDateYear = _.toNumber(_.split(_.get(_.last(this.posts), 'created_time'), '-')[0]);
      if (data.paging && _.size(this.posts) < 500 && lastDateYear > 2012) {
        this.getMoreData(_.get(data.paging, 'next'));
      } else {
        this.handleNext();
        setTimeout(() => {
          this.transformData();
        }, 1000);
      }
    })
  }

  transformData = () => {
    this.posts = _.filter(this.posts, (row) => {
      const dateYear = _.toNumber(_.split(_.get(row, 'created_time'), '-')[0]);
      return _.has(row, 'likes') && dateYear >= 2012
    })
    this.summaryInfo = calculateSummaryInfo(this.posts);
    const transformedIOData = _.map(this.posts, (row, index) => transformDataIO(row, this.summaryInfo, _.get(_.get(this.posts, (index + 1), {}), 'created_time', null)));
    this.network.train(transformedIOData, {
      errorThresh: 0.005,
      iterations: 5000,
      log: false,
      logPeriod: 100,
      learningRate: 0.3
    });

    const reverseTransformedIOData = _.map(this.posts, (row, index) => transformDataIO(row, this.summaryInfo, _.get(_.get(this.posts, (index + 1), {}), 'created_time', null), true));
    this.reverseNetwork.train(reverseTransformedIOData, {
      errorThresh: 0.005,  // error threshold to reach
      iterations: 5000,   // maximum training iterations
      log: false,           // console.log() progress periodically
      logPeriod: 100,       // number of iterations between logging
      learningRate: 0.5    // learning rate
    });

    this.setState({
      stepIndex: this.state.stepIndex + 1,
    });

    const result = this.network.run({
      reactionCount: 1,
      commentCount: 1,
      shareCount: 1,
    });

    // const reactionResult = this.network.run({
    //   reactionCount: 1,
    // });
    //
    // const commentResult = this.network.run({
    //   commentCount: 1,
    // });
    //
    // const shareResult = this.network.run({
    //   shareCount: 1,
    // });
    //
    // const noResult = this.network.run({
    //   reactionCount: 0,
    //   commentCount: 0,
    //   shareCount: 0,
    // });
    // console.log(result, reactionResult, commentResult, shareResult, noResult);

    this.setState({ result, complete: true });
  }

  onFailure = (err) => {
    console.log(err);
  }

  handleSlide = (slide, newValue) => {
    let result;
    switch (slide) {
      case 0:
        result = this.network.run({
          reactionCount: newValue,
          commentCount: this.state.commentCount,
          shareCount: this.state.shareCount,
        });
        this.setState({ reactionCount: newValue, result });
        break;
      case 1:
        result = this.network.run({
          reactionCount: this.state.reactionCount,
          commentCount: newValue,
          shareCount: this.state.shareCount,
        });
        this.setState({ commentCount: newValue, result });
        break;
      case 2:
        result = this.network.run({
          reactionCount: this.state.reactionCount,
          commentCount: this.state.commentCount,
          shareCount: newValue
        });
        this.setState({ shareCount: newValue, result });
        break;
      default:
        result = this.network.run({
          reactionCount: newValue,
          commentCount: this.state.commentCount,
          shareCount: this.state.shareCount,
        });
        this.setState({ reactionCount: newValue, result });
    }
  }

  onPost = () => {
    // (https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)
  }

  render() {
    let result;
    if (this.state.complete) {
      const linkRegex = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/;
      const type = this.state.hasVideo ? 'video' : this.state.hasPhoto ? 'photo' : linkRegex.test(this.state.message) ? 'link' : 'status';
      const post = {
        created_time: this.state.date.getTime(),
        message: this.state.message,
        privacy: {
          value: this.state.privacy,
        },
        type,
        comments: {
          summary: {
            total_count: 0,
          },
        },
        reactions: {
          summary: {
            total_count: 0,
          },
        },
        shares: {
          count: 0,
        },
        likes: {
          summary: {
            total_count: 0,
          },
        },
      }
      const reverseTransformedPost = transformDataIO(post, this.summaryInfo, _.get(_.get(this.posts, 0, {}), 'created_time', null), true);

      result = this.reverseNetwork.run(reverseTransformedPost.input);
      console.log(
        reverseTransformedPost,
        result.commentCount * this.summaryInfo.maxComment,
        result.reactionCount * this.summaryInfo.maxReaction,
        result.shareCount * this.summaryInfo.maxShares
      );
    }

    return (
      <div className="App">
        <Stepper activeStep={this.state.stepIndex} orientation="vertical">
          <Step>
            <StepLabel>Login to Facebook</StepLabel>
            <StepContent>
              <FacebookLogin
                appId="926701747482913"
                autoLoad={true}
                fields="name,posts.limit(100){reactions.limit(1).summary(true),comments.limit(0).summary(true),shares,privacy,likes.limit(1).summary(true),type,created_time,message}"
                scope="user_posts"
                callback={this.responseFacebook}
                onFailure={this.onFailure}
              />
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Getting Data from Facebook</StepLabel>
            <StepContent>
              <CircularProgress />
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Processing Data</StepLabel>
            <StepContent>
              <CircularProgress />
            </StepContent>
          </Step>
        </Stepper>
        {this.state.complete &&
          <div>
            <TextField
              value={this.state.message}
              multiLine={true}
              rows={6}
              rowsMax={6}
              onChange={(e, newValue) => this.setState({ changed: true, message: newValue })}
            />
            <DatePicker
              value={this.state.date}
              onChange={(e, newValue) => this.setState({ changed: true, date: newValue })}
            />
            <TimePicker
              value={this.state.date}
              onChange={(e, newValue) => this.setState({ changed: true, date: newValue })}
            />
            <Checkbox
              label="Includes Photo"
              checked={this.state.hasPhoto}
              onCheck={(e, isChecked) => this.setState({ hasPhoto: isChecked })}
            />
            <Checkbox
              label="Includes Video"
              checked={this.state.hasVideo}
              onCheck={(e, isChecked) => this.setState({ hasVideo: isChecked })}
            />
            <SelectField
              floatingLabelText="Privacy"
              value={this.state.privacy}
              onChange={(e, key, value) => this.setState({ privacy: value })}
            >
              <MenuItem value="allFriends" primaryText="All Friends" />
              <MenuItem value="friendsOfFriends" primaryText="Friends of Friends" />
              <MenuItem value="everyone" primaryText="Everyone" />
              <MenuItem value="custom" primaryText="Custom" />
              <MenuItem value="self" primaryText="Self" />
            </SelectField>
          </div>
        }
        {this.state.complete && <div className="slider-container">
          <div className="sliders">
            <div className="slider-label">Reactions:</div>
            <div className="slider-label">Comments:</div>
            <div className="slider-label">Shares:</div>
          </div>
          <div className="sliders">
            <Slider style={{width: 150}} step={0.10} value={this.state.reactionCount} onChange={(event, newValue) => this.handleSlide(0, newValue)}/>
            <Slider style={{width: 150}} step={0.10} value={this.state.commentCount} onChange={(event, newValue) => this.handleSlide(1, newValue)}/>
            <Slider style={{width: 150}} step={0.10} value={this.state.shareCount} onChange={(event, newValue) => this.handleSlide(2, newValue)}/>
          </div>
        </div>}
        <Graph result={this.state.result} summaryInfo={this.summaryInfo} />
      </div>
    );
  }
}

export default Facebook;
