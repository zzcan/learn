const cliSpinners = require('cli-spinners');
const logUpdate = require('log-update');
const chalk = require('chalk');
const boxen = require('boxen');

const loading = () => {
  let timer = null;

  return {
    show: () => {
      const spinner = cliSpinners.soccerHeader;
      let i = 0;
      timer = setInterval(() => {
        const {frames} = spinner;
        logUpdate(frames[i = ++i % frames.length]);
      }, spinner.interval);
    },
    hide: () => {
      clearInterval(timer)
    }
  }
}

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ENTERPRISE_ID = '1610550872771792944'

const start = async (args) => {
  const { token } = args;
  if(!token) {
    console.log(chalk.red('token为空'));
    process.exit(0)
  }

  const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "app-id": "3829",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "enterprise-id": ENTERPRISE_ID,
    "pragma": "no-cache",
    "request-id": "911ebb74-c299-495a-9c78-ffcbcfadbb74",
    "sec-ch-ua": "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "x-access-token": token,
    "Referer": "https://pro.coolcollege.cn/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
  const { show, hide } = loading();
  try {
    show();
    const userInfoRes = await fetch(
      "https://coolapi.coolcollege.cn/user-center-api/profile/get", 
      {
        headers, 
        "body": null,
        "method": "GET"
      }
    );
    const userInfo = (await userInfoRes.json()).data;
    if(!userInfo) {
      hide();
      console.log(chalk.red('获取不到user信息，请重试！'));
      process.exit(0);
    }

    const taskRes = await fetch(
      "https://coolapi.coolcollege.cn/training-manage-api/plan/myTask/getList?status=1&keyword=&pageNumber=1&pageSize=20&sortName=createTime&sortOrder=desc&type=2&timestamp=1685512233000", 
      {
        headers,
        "body": null,
        "method": "GET"
      }
    );
    const data = await taskRes.json();
    const taskIdList = (data ? (data.list || []) : []).map(item => item.id);

    for(let i = 0; i < taskIdList.length; i++) {
      const courseRes = await fetch(
        `https://coolapi.coolcollege.cn/training-manage-api/plan/myTask/getOne?id=${taskIdList[i]}`, 
        {
          headers,
          "body": null,
          "method": "GET"
        }
      );
      const courseData = await courseRes.json()
      const stageList = courseData && courseData.data ? (courseData.data.stageList || []) : [];
      const courseList = stageList.reduce((prev, curr) => {
        const { startTime, courseMappingList } = curr;
        if(startTime > +new Date()) return prev;
        const list = (courseMappingList || []).reduce((_prev, _curr) => {
          return [
            ..._prev,
            ...(_curr.courseInfo || []).map(info => ({
              ...info,
              parentCourseId: _curr.courseId
            }))
          ]
        }, []);
        return [
          ...prev,
          ...list
        ]
      }, [])
      
      for(let j = 0; j < courseList.length; j++) {
        const { parentCourseId, planId, courseId, name } = courseList[j];

        const progressRes = await fetch(
          `https://waf-coolapi.coolcollege.cn/training-manage-api/v2/${ENTERPRISE_ID}/users/${userInfo.id}/studies/${planId}/courses/${parentCourseId}/resources/${courseId}/save_progress`, 
          {
            headers,
            "body": JSON.stringify({
              "progress": 100,
              "recent_start": 0,
              tempTime: +new Date() + 10000000,
              "access_token": token,
            }),
            "method": "POST"
          }
        );
        const progressData = await progressRes.json();
        hide();
        if(progressData.progress === 100) {
          console.log(boxen(chalk.green(`课程【${name}】进度 100%！`), { borderStyle: 'classic', borderColor: 'green' }))
        } else {
          console.log(chalk.red(progressData))
        }
      }
    }
  } catch (error) {
    console.log(chalk.red(error))
    process.exit(0)
  } finally {
    hide();
  }
}

module.exports = {
  start
}
