import { Web } from "sip.js";

const api = "http://localhost:8000";
const runButton = document.getElementById("runButton");
const hangupButton = document.getElementById("hangupButton");
const uploadInput = document.getElementById("uploadInput");

const context = new AudioContext();
const gainNode = context.createGain();
gainNode.connect(context.destination);

const getAccount = async () => {
  const response = await fetch(`${api}/sip`);
  const { aor, endpoint } = await response.json();
  return { aor, endpoint };
};

const createUser = async (aor, server) => {
  const user = new Web.SimpleUser(server, { aor });
  await user.connect();
  await user.register();
  return user;
};

const runCall = async (aor, name) => {
  const data = { aor, name };
  await fetch(`${api}/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

const uploadRecord = (file) => {  
  return new Promise(async (resolve) => {
    uploadInput.click();
    uploadInput.onchange = () => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(uploadInput.files[0]);

      reader.onload = (event) => {
        context.decodeAudioData(event.target.result, (buffer) => {
          const soundSource = context.createBufferSource();
          soundSource.buffer = buffer;
          soundSource.start(0);
          soundSource.connect(gainNode);

          const destination = context.createMediaStreamDestination();
          soundSource.connect(destination);
          resolve(destination)
        });
      }
    }
  })
}

const main = async () => {
  const { aor, endpoint } = await getAccount();
  const user = await createUser(aor, endpoint);
  let localMediaStream;

  const audio = new Audio();
  user.delegate = {
    onCallReceived: async () => {
      await user.answer();
      runButton.hidden = true;
      hangupButton.hidden = false;
      hangupButton.disabled = false;
      
      user.localMediaStream = localMediaStream;
      audio.srcObject = user.remoteMediaStream;
      audio.play();
    },
    onCallHangup: () => {
      audio.srcObject = null;
      runButton.hidden = false;
      runButton.disabled = false;
      hangupButton.hidden = true;
    },
  };

  runButton.addEventListener("click", async () => {
    localMediaStream = await uploadRecord();

    runButton.disabled = true;
    runCall(aor, "Peter").catch(() => {
      runButton.disabled = false;
    });
  });

  hangupButton.addEventListener("click", async () => {
    hangupButton.disabled = true;
    await user.hangup().catch(() => {
      hangupButton.disabled = false;
    });
  });
};

main();
