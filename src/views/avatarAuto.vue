<template>
  <div class="avatar">
    <el-container>
      <el-aside v-if="showActions" width="220px" height="840px">
        <el-row>
          <el-button style="width: 160px; margin-bottom: 16px" @click="start()" type="primary">启动</el-button>
          <div class="nlp">
            <div class="label">语义理解</div>
            <el-switch v-model="nlp"></el-switch>
          </div>
          <el-input
            type="textarea"
            placeholder="请输入内容,包括符号在内，最大2000字符"
            v-model="textarea"
            maxlength="2000"
            show-word-limit
            :autosize="{ minRows: 5, maxRows: 10 }"
          >
          </el-input>
          <el-button style="margin: 0px" @click="writeText()" type="primary">发送文本</el-button>
          <el-button style="margin: 0px" @click="interrupt()" type="primary">打断</el-button>
          <el-input v-model="action" placeholder="执行动作"></el-input>
          <el-button style="margin: 0px" @click="writeCmd()" type="primary">执行动作</el-button>
          <el-button style="margin: 0px" @click="startRecord()" v-if="recorderbutton == false" type="primary"
            >开启录音</el-button
          >
          <el-button style="margin: 0px" @click="stopRecord()" v-if="recorderbutton == true" type="primary"
            >关闭录音</el-button
          >
          <el-button style="margin: 0px" @click="stop()" type="primary">关闭连接</el-button>
          <el-button style="margin: 0px" @click="destroy()" type="primary">销毁SDK</el-button>
        </el-row>
      </el-aside>

      <el-main class="htmleaf-content" style="padding: 0px">
        <div class="weather rain" id="wrapper"></div>

        <template>
          <el-button style="margin: 0px" @click="startAuto()" type="primary">{{
            isStarted ? "结束对话" : "开启对话"
          }}</el-button>
          <el-button style="margin: 0px" @click="showActions = !showActions" type="primary"
            >{{ showActions ? "隐藏" : "显示" }}操作按钮</el-button
          >
        </template>
        <div v-if="false">
          <span>透明度</span><input type="range" id="opacityRange" min="0" max="1" step="0.1" value="1" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
//模块导入
import AvatarPlatform, { PlayerEvents, SDKEvents } from "../vm-sdk/avatar-sdk-web_3.1.1.1011/index.js";

//动态虚拟人调节透明度
document.addEventListener("DOMContentLoaded", function () {
  const div = document.getElementById("wrapper");
  const range = document.getElementById("opacityRange");
  range?.addEventListener("input", function () {
    div.style.opacity = this.value;
  });
});

let avatarPlatform2 = null;
let recorder = null;
export default {
  name: "avatarComponent",
  data() {
    return {
      noNeed: false,
      isStarted: false,
      showActions: false,
      SetApiInfodialog: false,
      SetGlobalParamsdialog: false,
      form: {
        appid: "e76cbde9", //到交互平台-接口服务中获取
        apikey: "302c37e7e091f21b9e538aa6669c55c4", //到交互平台-接口服务中获取
        apisecret: "OWU4NGY1MWI3OGM1MWY0NmUzYjFlNzAy", //到交互平台-接口服务中获取
        sceneid: "180957947050987520", //到交互平台-接口服务中获取，即"接口服务ID"
        serverurl: "wss://avatar.cn-huadong-1.xf-yun.com/v1/interact", //接口地址，无需更改
      },
      setglobalparamsform: {
        stream: {
          protocol: "xrtc", //（必传）实时视频协议，支持webrtc/xrtc/rtmp，其中只有xrtc支持透明背景，需参数alpha传1
          fps: 25, //（非必传）视频刷新率,值越大，越流畅，取值范围0-25，默认25即可
          bitrate: 1000000, //（非必传）视频码率，值越大，越清晰，对网络要求越高，默认1000000即可
          alpha: 1, //（非必传）是否开启透明背景，0关闭1开始，需配合protocol=xrtc使用
        },
        avatar: {
          avatar_id: "110117005", //（必传）授权的形象资源id，请到交互平台-接口服务-形象列表中获取
          width: 1080, //（非必传）视频分辨率宽（不是画布的宽，调整画布大小需调整名为wrapper的div宽）
          height: 1920, //（非必传）视频分辨率高（不是画布的高，调整画布大小需调整名为wrapper的div高）
          mask_region: "[0,0,1080,1920]", //（非必传）形象裁剪参数，[从左到右，从上到下，从右到左，从下到上]
          scale: 1, //（非必传）形象缩放比例，取值范围0.1-1
          move_h: 0, //（非必传）形象左右移动
          move_v: 0, //（非必传）形象上下移动
          audio_format: 1, //（非必传）音频采样率，传1即可
        },
        tts: {
          vcn: "x4_lingxiaoying_assist", //（必传）授权的声音资源id，请到交互平台-接口服务-声音列表中获取
          speed: 50, //（非必传）语速
          pitch: 50, //（非必传）语调
          volume: 100, //（非必传）音量
          emotion: 13, //（非必传）情感系数，仅带有情感能力的超拟人音色支持该能力，普通音色不支持
        },
        air: {
          //动作模式
          air: 1, //（非必传）是否开启自动动作，0关闭，1开启（需配合nlp=true时生效)，当开启时，星火大模型会根据语义理解的内容自动插入动作
          add_nonsemantic: 1, //（非必传）是否开启无指向性动作，0关闭，1开启（需配合nlp=true时生效)，虚拟人会做没有意图指向性的动作
        },
        avatar_dispatch: {
          interactive_mode: 1, //（非必传）0追加模式，1打断模式
        },
        subtitle: {
          subtitle: 1, //（非必传）开启字幕，2D形象支持字幕，透明背景不支持字幕，3D形象不支持字幕（3D形象多为卡通形象，2D多为真人形象）
          font_color: "#709b9c", //（非必传）字体颜色
          font_name: "Sanji.Suxian.Simple", //（非必传）不支持自定义字体，若不想使用默认提供的
          //字体，那么可以设置asr和nlp监听事件，去获取语音识别和语义理解的文本，自己前端贴字体。
          //支持一下字体：'Sanji.Suxian.Simple','Honglei.Runninghand.Sim','Hunyuan.Gothic.Bold',
          //'Huayuan.Gothic.Regular','mainTitle'
          position_x: 100, //（非必传）设置字幕水平位置，必须配置width、height一起使用，否则字幕不显示
          position_y: 0, //（非必传）设置字幕竖向位置，必须配置width、height一起使用，否则字幕不显示
          font_size: 10, //（非必传）设置字幕字体大小，取值范围：1-10
          width: 100, //（非必传）设置字幕宽
          height: 100, //（非必传）设置字幕高
        },
        enable: false, //demo中用来控制是否开启背景的参数，与虚拟人参数无关
        background: {
          type: "res_key", //（非必传）上传图片的类型，支持url以及res_key。（res_key请到交互平台-素材管理-背景中上传获取)
          data: "22SLM2teIw+aqR6Xsm2JbH6Ng310kDam2NiCY/RQ9n6dw47gMO+7gGUJfWWfkqD3VRUASnpPTgZc9Sx9WWbPxkBGjSqGB4vHGz7EKmLghHzBtFUVrJMNj2bHWNr2c1Oylh37bqg3YF7t9IanX0E5kfqYj8UrnkCHoR7GFm4KaVaoLf2vRB/QfLBMNpJmiQLFaIt2htzAJqRqPVWT3L6cdqqUEoi9oqrj1dCc81qJKvu22oCrCqQwt93SI4kF1UzbD/bkv1JJnZx9QgEViqqSTGRYlwV+uF0o6kmNMJOtq9HP9f0Y+lY8qaHVZ1Cs1NevZBt9v/AmIl4M+UzdviZSX/ArgXujT6GKNWy14z058UQ=",
          //（非必传）图片的值，当type='url'时,data='http://xxx/xxx.png'，当type='res_key'时，data='res_key值'（res_key请到交互平台-素材管理-背景中上传获取)
        },
      },
      textarea: "你好呀，介绍一下数字人",
      vc: "",
      recorderbutton: false,
      nlp: true,
      emotion: 13,
      action: "A_RH_hello_O",
      volume: 100,
    };
  },
  methods: {
    initSDK() {
      //必须先实例化SDK，再去调用其挂载的方法
      avatarPlatform2 = new AvatarPlatform();
      if (avatarPlatform2 != null) {
        console.log("实例化SDK成功");
      }
    },
    createRecoder() {
      if (avatarPlatform2 != null) {
        recorder = avatarPlatform2.createRecorder();
        console.log("创建录音器成功");
      } else {
        alert("请实例化SDK实例");
      }
    },
    setSDKEvenet() {
      //绑定SDK事件
      if (avatarPlatform2 != null) {
        avatarPlatform2
          .on(SDKEvents.connected, function (initResp) {
            console.log("SDKEvent.connect:initResp:", initResp);
          })
          .on(SDKEvents.stream_start, function () {
            console.log("stream_start");
          })
          .on(SDKEvents.disconnected, function (e) {
            console.log("SDKEvent.disconnected:", e);
            if (e) {
              // 因为异常 而导致的断开！ 此处可以进行 提示通知等
              console.error("ws link disconnected because of Error");
              console.error(e.code, e.message, e.name, e.stack);
            }
          })
          .on(SDKEvents.nlp, (nlpData) => {
            console.log("语义理解内容nlp:", nlpData.text, nlpData.index, nlpData);
            if (nlpData.index == 0 && nlpData.text.includes("中午")) {
              avatarPlatform2.player.muted = true;
              console.info(avatarPlatform2);
              this.noNeed = true;
              console.info("设置noNeed = true");
              nlpData.status = 2;
            }
          })
          .on(SDKEvents.frame_start, (frame_start) => {
            if (this.noNeed) {
              avatarPlatform2.interrupt();
              setTimeout(() => {
                this.noNeed = false;
                avatarPlatform2.player.muted = false;
                console.info("noNeed推流开始时打断");
                avatarPlatform2.writeText("阻止进一步回答喽!不好呀！", {
                  nlp: false,
                  avatar_dispatch: {
                    interactive_mode: 1, //（非必传）0追加模式，1打断模式
                  },
                });
              }, 1000);
            }
            console.log("推流开始（可以看作一段文本开始播报时间点）frame_start:", frame_start);
          })
          .on(SDKEvents.frame_stop, function (frame_stop) {
            console.log("推流结束（可以看作一段文本结束播报时间点）frame_stop:", frame_stop);
          })
          .on(SDKEvents.error, function (error) {
            console.log("错误信息error:", error);
          })
          .on(SDKEvents.connected, function () {
            console.log("connected");
          })
          .on(SDKEvents.asr, (asrData) => {
            console.log("语音识别数据asr:", asrData.text, asrData);
          })
          .on(SDKEvents.tts_duration, function (ttsData) {
            console.log("语音合成用时tts：", ttsData);
          })
          .on(SDKEvents.subtitle_info, function (subtitleData) {
            console.log("subtitleData：", subtitleData);
          })
          .on(SDKEvents.action_start, function (action_start) {
            console.log("动作推流开始（可以看作动作开始时间节点）action_start:", action_start);
          })
          .on(SDKEvents.action_stop, function (action_stop) {
            console.log("动作推流结束（可以看作动作结束时间点）action_stop：", action_stop);
          });
        console.log("监听SDK事件成功");
      } else {
        alert("请先实例化SDK");
      }
    },
    setPlayerEvenet() {
      if (avatarPlatform2 != null) {
        //绑定播放器事件
        const player = avatarPlatform2.createPlayer();
        player
          .on(PlayerEvents.play, function () {
            console.log("paly");
          })
          .on(PlayerEvents.playing, function () {
            console.log("playing");
          })
          .on(PlayerEvents.waiting, function () {
            console.log("waiting");
          })
          .on(PlayerEvents.stop, function () {
            console.log("stop");
          })
          .on(PlayerEvents.playNotAllowed, function () {
            console.log(
              "playNotAllowed：触发了游览器限制自动播放策略，播放前必须与游览器产生交互（例如点击页面或者dom组件），触发该事件后调用avatarPlatform2.player.resume()方法来接触限制"
            );
            player.resume();
          });
        console.log("监听播放器事件成功");
      } else {
        alert("请先实例化SDK");
      }
    },
    SetApiInfo2() {
      if (avatarPlatform2 == null) {
        alert("请先实例化SDK");
      } else {
        const params = {
          appId: this.form.appid,
          apiKey: this.form.apikey,
          apiSecret: this.form.apisecret,
          serverUrl: this.form.serverurl,
          sceneId: this.form.sceneid,
        };
        //初始化SDK
        avatarPlatform2.setApiInfo(params);
        console.log("初始化SDK成功", params);
      }
    },
    SetGlobalParams() {
      if (avatarPlatform2 != null) {
        let params = Object.assign({}, this.setglobalparamsform);
        avatarPlatform2.setGlobalParams(params);
        console.log("设置的全局变量为：", params);
      } else {
        alert("请先实例化SDK");
      }
    },
    start() {
      if (avatarPlatform2 != null) {
        avatarPlatform2.start({ wrapper: document.querySelector("#wrapper") }).catch((e) => {
          console.error(e.code, e.message, e.name, e.stack);
        });
      } else {
        alert("请先实例化SDK");
      }
    },
    writeText() {
      if (avatarPlatform2 != null) {
        const text = this.textarea;
        if (text != "" && this.vc == "") {
          avatarPlatform2.writeText(text, {
            nlp: this.nlp, //是否开启语义理解
            tts: {
              volume: 100,
            },
          });
        } else if (text != "" && this.vc != "") {
          avatarPlatform2.writeText(text, {
            nlp: this.nlp, //是否开启语义理解
            tts: {
              vcn: this.vc, //变声
              volume: 100,
              emotion: this.emotion,
            },
          });
        } else {
          alert("内容不许为空");
        }
      } else {
        alert("请先实例化SDK");
      }
    },
    writeCmd() {
      avatarPlatform2.writeCmd("action", this.action);
    },
    interrupt() {
      if (avatarPlatform2 != null) {
        avatarPlatform2.interrupt();
        console.info("打断了");
      } else {
        alert("请先实例化SDK");
      }
    },
    startRecord() {
      if (avatarPlatform2 != null) {
        avatarPlatform2.recorder.startRecord(
          0,
          () => {
            console.warn("STOPED RECORDER");
          },
          {
            nlp: true,
            avatar_dispatch: {
              interactive_mode: 0, //交互模式（追加或打断）
            },
          }
        );
        //关闭录音按钮显示
        this.recorderbutton = true;
      } else {
        alert("请先实例化SDK");
      }
    },
    stopRecord() {
      if (avatarPlatform2 != null) {
        avatarPlatform2.recorder.stopRecord();
        //开启录音按钮显示
        this.recorderbutton = false;
      } else {
        alert("请先实例化SDK");
      }
    },
    stop() {
      if (avatarPlatform2 != null) {
        avatarPlatform2.stop();
      } else {
        alert("请先实例化SDK");
      }
    },
    destroy() {
      if (avatarPlatform2 != null) {
        //销毁SDK示例，内部包含stop协议，重启需重新示例化avatarPlatform实例
        avatarPlatform2.destroy();
        avatarPlatform2 = null;
      } else {
        alert("请先实例化SDK");
      }
    },
    open2(text) {
      this.$message({
        message: text,
        type: "success",
      });
    },
    startAuto() {
      if (!this.isStarted) {
        this.initFuns();
        this.start();
        this.startRecord();
      } else {
        this.stop();
        this.stopRecord();
        this.destroy();
      }
      this.isStarted = !this.isStarted;
    },
    initFuns() {
      //实例化SDK
      this.initSDK();
      //设置SDK事件
      this.setSDKEvenet();
      //设置播放器事件
      this.setPlayerEvenet();
      //创建录音器
      this.createRecoder();
      //初始化SDK信息
      this.SetApiInfo2();
      //设置全局变量
      this.SetGlobalParams();
    },
  },
  mounted() {
    this.initFuns();
  },

  beforeDestroy() {
    //关闭页面时调用stop协议，确保链接断开，释放资源
    if (avatarPlatform2) {
      avatarPlatform2.stop();
    }
  },
};
</script>

<style scoped>
.el-button,
.el-input,
.el-textarea {
  margin-top: 8px !important;
  margin-right: 8px !important;
}

.el-input,
.el-textarea {
  width: 200px;
}
.nlp {
  display: flex;
  justify-content: center;
  color: #fff;
}
.nlp .label {
  margin-right: 6px;
}
#wrapper {
  min-height: 600px;
  height: 90%;
  width: 100%;
}
.error {
  border-block-color: red;
}
.widthclass {
  width: 400px;
}
span {
  color: red;
}
</style>
