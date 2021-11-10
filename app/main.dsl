context {
    input endpoint: string;
    input name: string;
}

start node root {
    do {
        #connectSafe($endpoint);
        #waitForSpeech(1000);
        wait *;
    }

    transitions {
        repeat: goto Repeat on true;
    }
}

node Repeat {
    do {
        var phrase = #getMessageText();
        #sayText("You said");
        #sayText(#getMessageText());
        #waitForSpeech(2000);
        exit;
    }
}

digression Hangup {
  conditions {
    on true tags: onclosed;
  }

  do {
    exit;
  }
}
