---
title: hexo+github Action部署方案
date: 2025-11-29 18:48:00
tags:
- github
- hexo
mathjax: true

description: 这篇文章记录了如何使用 GitHub Actions 自动部署 Hexo 博客的完整流程。从准备 SSH 密钥、配置仓库分支，到编写 workflow 文件、测试 SSH 连接，再到最终自动生成并推送静态页面，本文提供了一个清晰可复用的部署方案，适合在多设备环境下希望摆脱手动 push/pull 的 Hexo 用户参考。
---

# 前言
由于身边有很多台电脑，每次写blog都要pull和push，过于麻烦，于是打算尝试用githubAction自动部署
# 准备
首先，确保你能在本地运行并将静态文件传到github上。这一部分不是本文主要内容，不做详细描述。接下来，本文你按照一个存储库两个分支来讲解。一个分支为`main`，存储hexo，另一个分支为`gh-pages`，作为静态文件存储及github pages的源文件。

接着，把你本地的hexo文件上传到`main`分支下。获取一个ssh，将公钥上传至github[SSH keys](https://github.com/settings/keys)，私钥作为Repository secrets上传到Action secrects(Settings-Secrets and variables-Actions secrets and variables-Repository secrets)，不妨设name为`SSH_PRIVATE_KEY`。

做好这些准备工作，就可以来配置action了。
# Action详解

你需要在`.github/workflows`下创建你的action文件，文件名任意，后缀为`yaml`。
## 基本信息
触发条件按设为push到main分支，node版本设置为最新版。
```yaml
name: hexo CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    strategy:
      matrix:
        node-version: [22.x]
```

## 修改__config.yaml
主要修改点在于推送部分`deploy`。

需要使用ssh连接推送，分支是`gh-pages`

以下是一个可能的示例：
```yaml
deploy:
  type: git
  repo: git@github.com:{YourUsername}/blog.git
  branch: gh-pages
```

## Steps
### Checkout repository
我也不知道这个干什么用，但是既然github建议有，那就写上吧。
```yaml
- name: Checkout repository
  uses: actions/checkout@v4
```
## Setup SSH
用于设置SSH密钥，这样才能在生成完毕后推送到`gh-pages`分支。
```yaml
- name: Setup SSH
  run: |
      mkdir -p ~/.ssh
      echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
      chmod 600 ~/.ssh/id_rsa
      ssh-keyscan github.com >> ~/.ssh/known_hosts
  env:
      SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
```
这个时候你设置的`SSH_PRIVATE_KEY`就起作用了。
## hexo 启动
就像你在本地运行一样。
```yaml
- name: Install Hexo CLI
  run: npm install -g hexo-cli
  - name: Configure Git
  run: |
      git config --global user.name "{这里填你的github用户名}"
      git config --global user.email "{填邮箱}"
  - run: npm install
  - run: hexo g -d
```
或者，你也可以使用任何一个具有更改你的存储库权限的github用户，不过要注意ssh公钥上传
## 小帮助
如果你在配置时遇到了一些问题，不妨做一下测试。主要问题就出现在ssh私钥的配置上。
```yaml
- name: Test SSH key
  run: |
    # 只查看前两行，防止泄露完整私钥
    head -n 2 ~/.ssh/id_rsa
    # 可选：查看文件是否存在、权限
    ls -l ~/.ssh/id_rsa
- name: Test SSH
  run: ssh -T git@github.com
```
`Test SSH`出现return1为正常现象，观察终端返回即可。

## 总结
```yaml
name: hexo CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    strategy:
      matrix:
        node-version: [22.x]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan github.com >> ~/.ssh/known_hosts
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: List environment variables
        run: |
          # 可选：查看文件是否存在、权限
          ls -l ~/.ssh/id_rsa
      - name: Test SSH
        run: ssh -T git@github.com

      - name: Install Hexo CLI
        run: npm install -g hexo-cli
      - name: Configure Git
        run: |
          git config --global user.name "{这里填你的github用户名}"
          git config --global user.email "{填邮箱}"
      - run: npm install
      - run: hexo g -d
```
把它上传到main分支，如果顺利的话你可以看到一个成功的action和一个新的分支`gh-pages`。注意将githubpages的Build and deployment的分支改为`gh-pages`。
# 结语
现在，在存储库页面点`.`号，进入`github.dev`，你就可以随时随地写blog了。

本文就是这样写完的。