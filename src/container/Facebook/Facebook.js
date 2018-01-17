import React, { Component } from 'react';
import brain from 'brain';
import _ from 'lodash';
import axios from 'axios';
import { Button, Icon, Header, Modal, Input, Form } from 'semantic-ui-react'
import DateTime from 'react-datetime';
import firebase from 'firebase';
import { fireDb, fireFbLogin } from '../../utils/firebase.js';
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
      isChoosingProfile: false,
    };
  }

  handleNext = () => {
    const {stepIndex} = this.state;
    this.setState({
      stepIndex: stepIndex + 1,
    });
  };

  facebookLogin = () => {
    firebase.auth().signInWithPopup(fireFbLogin).then((result) => {
      console.log('result: ', result);
      this.facebookAccessToken = result.credential.accessToken;
      const firebaseUser = result.user;
      const facebookUserInfo = result.additionalUserInfo;
      const defaultProfile = {
        id: _.get(facebookUserInfo, ['profile', 'id']),
        name: _.get(facebookUserInfo, ['profile', 'name']),
        pictureUrl: _.get(facebookUserInfo, ['profile', 'picture', 'data', 'url']),
      };
      this.getFacebookProfiles(defaultProfile);
    }).catch((error) => {
      // Handle Errors here.
      console.log('error: ', error);
    });
  }

  getFacebookProfiles = (defaultProfile) => {
    const { id } = defaultProfile;
    axios.get(`https://graph.facebook.com/v2.11/${id}?`, {
      params: {
        fields: 'accounts{name,id,picture{url}}',
        access_token: this.facebookAccessToken,
      }
    }).then((result) => {
      console.log(result)
      const profiles = _.map(_.get(result, ['data', 'accounts', 'data'], []), (profile) => {
        return {
          id: _.get(profile, 'id'),
          name: _.get(profile, 'name'),
          pictureUrl: _.get(profile, ['picture', 'data', 'url']),
        };
      });
      if (_.size(profiles) === 0) {
        this.handleSelectProfile(defaultProfile)
      } else {
        profiles.unshift(defaultProfile);
        //show modal with profiles
        this.setState({ isChoosingProfile: true, profiles })
      }
    }).catch((error) => {
      // Handle Errors here.
      console.log('error: ', error);
    });
  }

  handleSelectProfile = (profile) => {
    this.setState({ isChoosingProfile: false })
    axios.post('/api/facebook', { profile, accessToken: this.facebookAccessToken })
    .then((response) => {
      console.log(response);
      this.handleNext();

      this.network.fromJSON(_.get(response, 'data.networkJSON', {}));
      this.reverseNetwork.fromJSON(_.get(response, 'data.reverseNetworkJSON', {}));
      this.reverseNetworkReactions.fromJSON(_.get(response, 'data.reverseNetworkReactionsJSON', {}));
      this.reverseNetworkComments.fromJSON(_.get(response, 'data.reverseNetworkCommentsJSON', {}));
      this.summaryInfo = _.get(response, 'data.summaryInfo', {});
      this.lastPostTime = _.get(response, 'data.lastPostTime', {});

      const result = this.network.run({
        reactionCount: 1,
        commentCount: 1,
        shareCount: 1,
      });

      this.setState({ result, complete: true });
    })
  }




  responseFacebook = (response) => {
    // this.handleNext();
    //
    // const profiles = _.concat([{
    //   accessToken: _.get(response, 'accessToken', null),
    //   id: _.get(response, 'id', null),
    //   name: _.get(response, 'name', ''),
    //   picture: _.get(response, 'picture', null),
    // }], _.get(response, 'accounts.data', []));
    //
    // const profile = profiles[0];
    //
    // fireDb.ref('users/' + profile.id).once('value').then((userSnap) => {
    //   console.log(userSnap.val());
    //   const fireUserProfiles = _.get(userSnap.val(), 'profiles', null);
    //   if (fireUserProfiles) {
    //     console.log('its here');
    //   } else {
    //     const saveProfiles = {};
    //     _.forEach(profiles, profileData => {
    //       saveProfiles[profileData.id] = {
    //         name: profileData.name || null,
    //         picture: _.get(profileData, ['picture', 'data', 'url'], null),
    //       }
    //     });
    //
    //     fireDb.ref('users/' + profile.id).set({
    //       profiles: saveProfiles,
    //     });
    //   }
    // });
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


    let profiles = [];
    if (this.state.isChoosingProfile) {
      profiles = _.map(this.state.profiles, (profile) => {
        console.log(profile);
        return (
          <div
            key={profile.id}
            className="profile-click"
            onClick={() => this.handleSelectProfile(profile)}
          >
            <h4>
              {profile.name}
            </h4>
            <img className="profile-images" src={profile.pictureUrl} />
          </div>
        );
      })
    }

    return (
      <div className="App">
        {!this.state.complete && <Button
          color='facebook'
          onClick={this.facebookLogin}
        >
          <Icon name='facebook' /> Facebook
        </Button>}

        <Modal open={this.state.isChoosingProfile} basic size='small'>
          <Header icon='user circle outline' content='Choose a Profile' />
          <Modal.Content>
            <div className="profiles-list">
              {profiles}
            </div>
          </Modal.Content>
        </Modal>

        { this.state.complete &&
          <div>
            <Form.TextArea
              value={this.state.message}
              rows={6}
              onChange={(e, newValue) => this.setState({ changed: true, message: newValue })}
            />
            <div>
              <DateTime
                value={this.state.date}
                onChange={(date) => {
                  console.log(date);
                  this.setState({ changed: true, date: date.toDate() })}
                }
              />
            </div>
            <Form.Checkbox
              label="Includes Photo"
              checked={this.state.hasPhoto}
              onClick={(e, { checked }) => this.setState({ hasPhoto: checked, changed: true })}
            />
            <Form.Checkbox
              label="Includes Video"
              checked={this.state.hasVideo}
              onClick={(e, { checked }) => this.setState({ hasVideo: checked, changed: true })}
            />
            <Form.Checkbox
              label="Love"
              checked={this.state.love}
              onClick={(e, { checked }) => this.setState({ love: checked, changed: true })}
            />
            <Form.Checkbox
              label="Wow"
              checked={this.state.wow}
              onClick={(e, { checked }) => this.setState({ wow: checked, changed: true })}
            />
            <Form.Checkbox
              label="Haha"
              checked={this.state.haha}
              onClick={(e, { checked }) => this.setState({ haha: checked, changed: true })}
            />
            <Form.Checkbox
              label="Sad"
              checked={this.state.sad}
              onClick={(e, { checked }) => this.setState({ sad: checked, changed: true })}
            />
            <Form.Checkbox
              label="Angry"
              checked={this.state.angry}
              onClick={(e, { checked }) => this.setState({ angry: checked, changed: true })}
            />
            <Form.Select
              label="Privacy"
              value={this.state.privacy}
              onChange={(e, key, value) => this.setState({ privacy: value, changed: true })}
              options={[
                { value: 'allFriends', text: 'All Friends' },
                { value: 'friendsOfFriends', text: 'Friends of Friends' },
                { value: 'everyone', text: 'Everyone' },
                { value: 'custom', text: 'Custom' },
                { value: 'self', text: 'Self' },
              ]}
            />
          </div>
        }
        {this.state.complete && <div className="slider-container">
          <Input
            label={`Reactions`}
            min={0}
            max={1}
            name='reactions'
            onChange={(event, { name, value }) => this.handleSlide(0, value)}
            step={0.1}
            type='range'
            value={this.state.reactionCount}
          />
          <Input
            label={`Comments`}
            min={0}
            max={1}
            name='comments'
            onChange={(event, { name, value }) => this.handleSlide(1, value)}
            step={0.1}
            type='range'
            value={this.state.commentCount}
          />
          <Input
            label={`Shares`}
            min={0}
            max={1}
            name='shares'
            onChange={(event, { name, value }) => this.handleSlide(2, value)}
            step={0.1}
            type='range'
            value={this.state.shareCount}
          />
        </div>}
        <Graph result={this.state.result} summaryInfo={this.summaryInfo} />
      </div>
    );
  }
}

export default Facebook;
