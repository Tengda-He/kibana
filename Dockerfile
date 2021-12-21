ARG NODE_VERSION=10.15.2

FROM node:${NODE_VERSION} AS base

ENV HOME '.'

RUN apt-get update && apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget openjdk-8-jre && \
rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y python-pip

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
&& unzip awscliv2.zip \
&& ./aws/install

RUN aws s3 cp s3://kibana.bfs.vendor/aes/chrome/google-chrome-stable_79.0.3945.117-1_amd64.deb ./tmp/google-chrome.deb \
&& apt install -y --allow-downgrades  /tmp/google-chrome.deb \
&& rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN groupadd -r kibana && useradd -r -g kibana kibana && mkdir /home/kibana && chown kibana:kibana /home/kibana

USER kibana