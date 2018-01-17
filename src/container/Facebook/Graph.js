import React, { Component } from 'react';
import _ from 'lodash';
import { HorizontalBar, Bar, Polar } from 'react-chartjs-2';
import { Segment, Statistic } from 'semantic-ui-react';

const style = {
  height: 280,
  width: 500,
  margin: 6,
  padding: 6,
  textAlign: 'center',
  display: 'inline-block',
};
const style2 = {
  padding: 6,
  margin: 6,
  textAlign: 'center',
  display: 'inline-block',
};

function secondsToString(seconds) {
  const numYears = Math.floor(seconds / 31536000) ? `${Math.floor(seconds / 31536000)} years ` : '';
  const numDays = Math.floor((seconds % 31536000) / 86400) ? `${Math.floor((seconds % 31536000) / 86400)} days ` : '';
  const numHours = Math.floor(((seconds % 31536000) % 86400) / 3600) ? `${Math.floor(((seconds % 31536000) % 86400) / 3600)} hours ` : '';
  const numMinutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60) ? `${Math.floor((((seconds % 31536000) % 86400) % 3600) / 60)} minutes` : '';
  return numYears + numDays + numHours + numMinutes;
}

function secondsToTime(seconds) {
  const hour = Math.floor(((seconds % 31536000) % 86400) / 3600);
  const minute = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  return `${hour > 12 ? hour - 12 : hour}:${minute < 10 ? '0' + minute : minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

class Graph extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { result, summaryInfo } = this.props;
    let barData,
    sentenceBarData,
    privacyBarData,
    postTypeData,
    timeOfDay,
    timeFromLastPost,
    timeToNextPost,
    postLength,
    reactionTypeBarData,
    keyWordBarData;

    if (result) {
      const defaultDataset = {
        backgroundColor: 'rgba(99,132,255,0.2)',
        borderColor: 'rgba(99,132,255,1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(99,132,255,0.4)',
        hoverBorderColor: 'rgba(99,132,255,1)',
      }

      const colors = {
        backgroundColor: [
          '#FF6384', //red
          '#4BC0C0', //green
          '#FFCE56', //yellow
          '#36A2EB', //blue
          '#C275EC', //purple
          '#E7E9ED', //gray
        ],
      };

      barData = {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        datasets: [{
          ...defaultDataset,
          label: '',
          data: [
            result.Monday * 100,
            result.Tuesday * 100,
            result.Wednesday * 100,
            result.Thursday * 100,
            result.Friday * 100,
            result.Saturday * 100,
            result.Sunday * 100
          ],
        }]
      };

      sentenceBarData = {
        labels: ['Question', 'Command', 'Exclamation'],
        datasets: [{
          ...defaultDataset,
          label: '',
          data: [
            result.interrogative * 100,
            result.imperative * 100,
            result.exclamatory * 100,
          ],
        }]
      };

      privacyBarData = {
        labels: ['All Friends', 'Friends of Friends', 'Everyone', 'Custom', 'Self'],
        datasets: [{
          ...defaultDataset,
          label: '',
          data: [
            result.allFriends * 100,
            result.friendsOfFriends * 100,
            result.everyone * 100,
            result.custom * 100,
            result.self * 100,
          ],
        }]
      };

      postTypeData = {
        labels: ['status', 'photo', 'link', 'video', 'event', 'offer'],
        datasets: [{
          ...colors,
          label: '',
          data: [
            result.status * 100,
            result.photo * 100,
            result.link * 100,
            result.video * 100,
            result.event * 100,
            result.offer * 100
          ],
        }]
      };

      reactionTypeBarData = {
        labels: ['love', 'wow', 'haha', 'sad', 'angry'],
        datasets: [{
          ...colors,
          label: '',
          data: [
            result.love * 100,
            result.wow * 100,
            result.haha * 100,
            result.sad * 100,
            result.angry * 100,
          ],
        }]
      };

      keyWordBarData = {
        labels: [...summaryInfo.keyWords],
        datasets: [{
          ...colors,
          label: '',
          data: _.map(summaryInfo.keyWords, (word) => result[`kw-${word}`] * 100),
        }]
      }

      timeOfDay = result.minutesOfDay * 60 * 1440;
      timeFromLastPost = result.timeFromLastPost * summaryInfo.maxTimeFromLastPost / 1000;
      timeToNextPost = result.timeFromNextPost * summaryInfo.maxTimeFromLastPost / 1000;
      postLength = result.postLength * summaryInfo.maxPostLength;
    }


    return (
      <div>
        {result &&
          <div>
            <Segment style={style}>
              <Bar
              	data={barData}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                          min: 0,
                          max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Segment>
            <Segment style={style}>
              <Polar
              	data={postTypeData}
                options={{
                  scales: {
                    min: 0,
                    max: 100,
                  }
                }}
              />
            </Segment>
            <Segment style={style}>
              <HorizontalBar
              	data={sentenceBarData}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    xAxes: [{
                      ticks: {
                        min: 0,
                        max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Segment>
            <Segment style={style}>
              <Bar
              	data={privacyBarData}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                          min: 0,
                          max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Segment>
            <Segment style={style}>
              <Bar
              	data={reactionTypeBarData}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                          min: 0,
                          max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Segment>
            <Segment style={style}>
              <Bar
              	data={keyWordBarData}
              	width={100}
              	height={50}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    yAxes: [{
                      ticks: {
                          min: 0,
                          max: 100,
                      }
                    }]
                  }
                }}
                legend={{ display: false }}
              />
            </Segment>
            <Segment style={style2}>
              <Statistic.Group
                items={[
                  { key: 'timeOfDay', label: 'Best Time of Day', value: secondsToTime(timeOfDay) },
                  { key: 'postLength', label: 'Post Length in Characters', value: Math.ceil(postLength) },
                ]}
              />
            </Segment>
            <Segment style={style2}>
              <Statistic.Group
                items={[
                  { key: 'previousPost', label: 'Optimal Time from Previous Post', value: secondsToString(timeFromLastPost) },
                  { key: 'nextPost', label: 'Optimal Time to Next Post', value: secondsToString(timeToNextPost) },
                ]}
              />
            </Segment>
          </div>
        }
      </div>
    );
  }
}

export default Graph;
