import React, { Component } from 'react';
import _ from 'lodash';
import Paper from 'material-ui/Paper';
import { HorizontalBar, Bar, Polar } from 'react-chartjs-2';

const style = {
  height: 280,
  width: 500,
  margin: 6,
  padding: 6,
  textAlign: 'center',
  display: 'inline-block',
};
const style2 = {
  height: 60,
  width: 500,
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
    console.log(result);
    let barData, sentenceBarData, privacyBarData, postTypeData, timeOfDay, timeFromLastPost, postLength;
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
      }

      timeOfDay = result.minutesOfDay * 60 * 1440;
      timeFromLastPost = result.timeFromLastPost * summaryInfo.maxTimeFromLastPost / 1000;
      postLength = result.postLength * summaryInfo.maxPostLength;
    }


    return (
      <div>
        {result &&
          <div>
            <Paper style={style} zDepth={1}>
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
            </Paper>
            <Paper style={style} zDepth={1}>
              <Polar
              	data={postTypeData}
                options={{
                  scales: {
                    min: 0,
                    max: 100,
                  }
                }}
              />
            </Paper>
            <Paper style={style} zDepth={1}>
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
            </Paper>
            <Paper style={style} zDepth={1}>
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
            </Paper>
            <Paper style={style2} zDepth={1}>
              Best Time of Day -- {secondsToTime(timeOfDay)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Time From Previous Post -- {secondsToString(timeFromLastPost)}
            </Paper>
            <Paper style={style2} zDepth={1}>
              Post Length -- {Math.ceil(postLength)} characters
            </Paper>
          </div>
        }
      </div>
    );
  }
}

export default Graph;
