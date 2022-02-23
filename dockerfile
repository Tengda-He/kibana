ARG NODE_VERSION=8.14.0

FROM node:${NODE_VERSION} AS base

ENV HOME '.'

RUN apt-get update && apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
awscli libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget openjdk-8-jre && \
rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && apt-get update \
&& apt-get install -y rsync jq bsdtar --no-install-recommends

RUN aws s3 cp s3://kibana.bfs.vendor/aes/chrome/google-chrome-stable_94.0.4606.81-1_amd64.deb /tmp/google-chrome.deb \
&& apt install -y /tmp/google-chrome.deb && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN apt-get update && apt-get install -y python-pip

RUN pip install awscli

RUN groupadd -r kibana && useradd -r -g kibana kibana && mkdir /home/kibana && chown kibana:kibana /home/kibana

USER kibana