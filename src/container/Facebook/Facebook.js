import React, { Component } from 'react';
import brain from 'brain';
import FacebookLogin from 'react-facebook-login';
import _ from 'lodash';
import axios from 'axios';
import fireDb from '../../utils/firebase.js';
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
import {
  calculateSummaryInfo,
  transformDataIO,
} from '../../utils/data-transformer';
import Graph from './Graph';
import './Facebook.css';

class Facebook extends Component {
  constructor(props) {
    super(props);
    this.network = new brain.NeuralNetwork();
    this.reverseNetwork = new brain.NeuralNetwork();
    this.reverseNetworkReactions = new brain.NeuralNetwork();
    this.reverseNetworkComments = new brain.NeuralNetwork();

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

    const profiles = _.concat([{
      accessToken: _.get(response, 'accessToken', null),
      id: _.get(response, 'id', null),
      name: _.get(response, 'name', ''),
      picture: _.get(response, 'picture', null),
    }], _.get(response, 'accounts.data', []));

    const profile = profiles[0];

    fireDb.ref('users/' + profile.id).once('value').then((userSnap) => {
      console.log(userSnap.val());
      const fireUserProfiles = _.get(userSnap.val(), 'profiles', null);
      if (fireUserProfiles) {
        console.log('its here');
      } else {
        const saveProfiles = {};
        _.forEach(profiles, profileData => {
          saveProfiles[profileData.id] = {
            name: profileData.name || null,
            picture: _.get(profileData, ['picture', 'data', 'url'], null),
          }
        });

        fireDb.ref('users/' + profile.id).set({
          profiles: saveProfiles,
        });
      }
    })


    // axios.post('/api/facebook', { profile })
    // .then((response) => {
    //   console.log(response);
    //   this.handleNext();
    //
    //   this.network.fromJSON(_.get(response, 'data.networkJSON', {}));
    //   this.reverseNetwork.fromJSON(_.get(response, 'data.reverseNetworkJSON', {}));
    //   this.reverseNetworkReactions.fromJSON(_.get(response, 'data.reverseNetworkReactionsJSON', {}));
    //   this.reverseNetworkComments.fromJSON(_.get(response, 'data.reverseNetworkCommentsJSON', {}));
    //   this.summaryInfo = _.get(response, 'data.summaryInfo', {});
    //   this.lastPostTime = _.get(response, 'data.lastPostTime', {});
    //
    //   const result = this.network.run({
    //     reactionCount: 1,
    //     commentCount: 1,
    //     shareCount: 1,
    //   });
    //
    //   this.setState({ result, complete: true });
    // })
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
          data: [
            { type: this.state.love ? 'LOVE' : 'LIKE' },
            { type: this.state.wow ? 'WOW' : 'LIKE' },
            { type: this.state.haha ? 'HAHA' : 'LIKE' },
            { type: this.state.sad ? 'SAD' : 'LIKE' },
            { type: this.state.angry ? 'ANGRY' : 'LIKE' },
          ],
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
      const reverseTransformedPost = transformDataIO(post, this.summaryInfo, this.lastPostTime, true);

      result = this.reverseNetwork.run(reverseTransformedPost.input);
      const resultReaction = this.reverseNetworkReactions.run(reverseTransformedPost.input);
      const resultComment = this.reverseNetworkComments.run(reverseTransformedPost.input);
      console.log(
        reverseTransformedPost,
        result.reactionCount * this.summaryInfo.maxReaction,
        result.commentCount * this.summaryInfo.maxComment,
        result.shareCount * this.summaryInfo.maxShares,
        resultReaction.reactionCount * this.summaryInfo.maxReaction,
        resultComment.commentCount * this.summaryInfo.maxComment,
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
                fields="accounts,name,picture{url}"
                scope="user_posts,manage_pages"
                callback={this.responseFacebook}
                onFailure={this.onFailure}
              />
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Processing Data from Facebook</StepLabel>
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
            <Checkbox
              label="Love"
              checked={this.state.love}
              onCheck={(e, isChecked) => this.setState({ love: isChecked })}
            />
            <Checkbox
              label="Wow"
              checked={this.state.wow}
              onCheck={(e, isChecked) => this.setState({ wow: isChecked })}
            />
            <Checkbox
              label="Haha"
              checked={this.state.haha}
              onCheck={(e, isChecked) => this.setState({ haha: isChecked })}
            />
            <Checkbox
              label="Sad"
              checked={this.state.sad}
              onCheck={(e, isChecked) => this.setState({ sad: isChecked })}
            />
            <Checkbox
              label="Angry"
              checked={this.state.angry}
              onCheck={(e, isChecked) => this.setState({ angry: isChecked })}
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
